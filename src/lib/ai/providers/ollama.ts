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

/**
 * Talks to a local (or self-hosted) Ollama server over its HTTP API —
 * plain `fetch`, no SDK. Ollama's client libraries are thin wrappers over
 * this same endpoint, and pulling one in for a single POST would be an
 * extra dependency for no real benefit (the same reasoning already applied
 * to the Resend email integration in src/lib/email/send.ts).
 *
 * Wire format verified against Ollama's own API docs
 * (https://github.com/ollama/ollama/blob/main/docs/api.md), notably:
 *   - tool calls come back as `message.tool_calls: [{ function: { name,
 *     arguments } }]` with NO call id — we synthesize one so the rest of
 *     the app can treat every provider uniformly.
 *   - a tool result is sent back as `{ role: "tool", content, tool_name }`
 *     (not `name`, and no id).
 */
export class OllamaProvider implements AiProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434").replace(/\/$/, "");
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

    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        // No AbortSignal.timeout here on purpose in Phase 1 — a local model's
        // first response after loading into memory can legitimately take a
        // while. Revisit once real-world latency is measured.
      });
    } catch (err) {
      throw new AiProviderUnavailableError(
        `Could not reach Ollama at ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AiProviderResponseError(`Ollama responded ${res.status}: ${detail.slice(0, 500)}`);
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
          // Synthesized — see the class doc comment. Stable within a single
          // response, which is all the orchestration loop needs.
          id: `ollama_call_${index}`,
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
    tool_calls?: { function: { name: string; arguments: Record<string, unknown> } }[];
  };
  done?: boolean;
  done_reason?: string;
};
