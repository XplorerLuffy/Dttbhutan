import "server-only";
import {
  AiProviderResponseError,
  AiProviderUnavailableError,
  type AiCompletionRequest,
  type AiCompletionResult,
  type AiMessage,
  type AiProvider,
  type AiToolCall,
} from "@/lib/ai/provider";
import { ollamaBaseUrl, ollamaHeaders, explainOllamaStatus } from "@/lib/ai/ollamaConfig";

/**
 * Talks to an Ollama server over its HTTP API — local, self-hosted, or the
 * hosted service at https://ollama.com, which speaks the same paths and bodies
 * and only adds an API key (see ollamaConfig.ts). The hosted one is what a
 * Vercel deployment can actually reach: localhost on a serverless function is
 * the function itself, and nothing answers there.
 *
 * plain `fetch`, no SDK. Ollama's client libraries are thin wrappers over
 * this same endpoint, and pulling one in for a single POST would be an
 * extra dependency for no real benefit (the same reasoning already applied
 * to the Resend email integration in src/lib/email/send.ts).
 *
 * Wire format verified against Ollama's own API docs
 * (https://github.com/ollama/ollama/blob/main/docs/api.md), notably:
 *   - tool calls come back as `message.tool_calls: [{ function: { name,
 *     arguments } }]`. A local server sends no call id, so one is synthesized
 *     and the rest of the app can treat every provider uniformly. The hosted
 *     service *does* send one (verified: `{"id": "call_vbc2qebq", "function":
 *     {"index": 0, "name": …}}`), so its id is preferred when present rather
 *     than thrown away — the two are interchangeable downstream, but keeping
 *     the server's own makes a traced request line up with Ollama's logs.
 *   - a tool result is sent back as `{ role: "tool", content, tool_name }`
 *     (not `name`, and no id).
 */
/**
 * Statuses that mean "not now" rather than "not ever".
 *
 * 500 is the one that matters here, and it is not theoretical: production
 * answered a visitor with "temporarily unavailable" because Ollama's hosted
 * service returned a single `500 Internal Server Error (ref: …)` mid-turn,
 * while the same request succeeded on every attempt minutes later. The Gemini
 * provider has retried these since it was written; this one never did, so one
 * transient upstream blip was a failed conversation.
 *
 * 4xx is deliberately absent. A 404 (unknown model), 410 (retired model) and
 * 401 (bad key) are all settled facts — verified against the live service —
 * and retrying them only spends the request's remaining time.
 */
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * Two extra attempts. A reply can take several model calls (MAX_TOOL_ROUNDS)
 * and the route has a wall-clock budget, so this has to stay small — but the
 * failure being retried is a momentary upstream fault, which a short pause
 * clears far more often than not.
 */
const RETRY_DELAYS_MS = [600, 1800];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class OllamaProvider implements AiProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = ollamaBaseUrl();
    this.model = process.env.OLLAMA_MODEL?.trim() || "llama3.2";
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const body = {
      model: this.model,
      messages: request.messages.map(toOllamaMessage),
      stream: false,
      ...(request.tools?.length
        ? {
            tools: request.tools.map((tool) => ({
              type: "function" as const,
              function: {
                name: tool.name,
                description: tool.description,
                parameters: tool.parameters,
              },
            })),
          }
        : {}),
    };

    const payloadJson = JSON.stringify(body);
    let res: Response | null = null;
    let lastTransient = "";

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);

      try {
        res = await fetch(`${this.baseUrl}/api/chat`, {
          method: "POST",
          headers: ollamaHeaders(),
          body: payloadJson,
          // No AbortSignal.timeout here on purpose in Phase 1 — a local model's
          // first response after loading into memory can legitimately take a
          // while. Revisit once real-world latency is measured.
        });
      } catch (err) {
        throw new AiProviderUnavailableError(
          `Could not reach Ollama at ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      if (res.ok) break;

      const detail = await res.text().catch(() => "");
      const safe =
        `Ollama responded ${res.status}: ${detail.slice(0, 500)}` +
        explainOllamaStatus(res.status, this.baseUrl);

      if (!RETRYABLE_STATUS.has(res.status)) throw new AiProviderResponseError(safe);

      lastTransient = safe;
      res = null;
    }

    if (!res) {
      throw new AiProviderResponseError(
        `${lastTransient} (gave up after ${RETRY_DELAYS_MS.length + 1} attempts)`
      );
    }

    const payload = (await res.json().catch((err) => {
      throw new AiProviderResponseError(`Ollama returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
    })) as OllamaChatResponse;

    const message = payload.message;
    if (!message) {
      throw new AiProviderResponseError("Ollama response had no message field");
    }

    return {
      content: message.content ?? "",
      toolCalls: (message.tool_calls ?? []).map(
        (call, index): AiToolCall => ({
          // The hosted service's own id when it sent one, else a synthesized
          // one — see the class doc comment. Either way stable within a single
          // response, which is all the orchestration loop needs.
          id: call.id || `ollama_call_${index}`,
          name: call.function.name,
          arguments: call.function.arguments ?? {},
        })
      ),
    };
  }
}

function toOllamaMessage(message: AiMessage): OllamaWireMessage {
  switch (message.role) {
    case "system":
    case "user":
      return { role: message.role, content: message.content };
    case "assistant":
      return {
        role: "assistant",
        content: message.content,
        ...(message.toolCalls?.length
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                function: { name: call.name, arguments: call.arguments },
              })),
            }
          : {}),
      };
    case "tool":
      return { role: "tool", content: message.content, tool_name: message.toolName };
  }
}

type OllamaWireMessage =
  | { role: "system" | "user"; content: string }
  | {
      role: "assistant";
      content: string;
      tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[];
    }
  | { role: "tool"; content: string; tool_name: string };

type OllamaChatResponse = {
  message?: {
    role: string;
    content: string;
    /** `id` is absent on a local server and present on the hosted service;
     * `index` rides along on the hosted one and is not used. */
    tool_calls?: { id?: string; function: { name: string; arguments: Record<string, unknown> } }[];
  };
  done?: boolean;
  done_reason?: string;
};
