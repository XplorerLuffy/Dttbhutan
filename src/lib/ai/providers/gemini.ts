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
import { explainGeminiStatus } from "@/lib/ai/geminiKey";

/**
 * Google Gemini over plain fetch (no SDK — same reasoning as the Ollama
 * provider: this is one POST, not enough surface to justify a dependency).
 * Added as a free-tier-testable stand-in for a hosted provider: Google AI
 * Studio issues free API keys with no card required, for exactly the kind
 * of "prove the abstraction with a real model" need this exists for.
 *
 * Wire format verified against Google's own live API discovery document
 * (`GET /$discovery/rest?version=v1beta` on this same host — fetched and
 * inspected directly rather than assumed), notably:
 *   - `Content.role` is "user" or "model", not "assistant".
 *   - `Schema.type` for function parameters is UPPERCASE ("OBJECT",
 *     "STRING", ...), unlike the lowercase JSON Schema our own
 *     AiToolDefinition uses — converted in toGeminiSchema() below.
 *   - `FunctionCall` has a real `id` (round-tripped as-is, unlike Ollama's
 *     synthesized one). `FunctionResponse.response` must be a JSON
 *     *object*, not a string — our tool results are JSON.stringify'd by
 *     assistant.ts before reaching here, so this parses them back.
 */
/** Statuses that mean "not now" rather than "not ever". 500 is included
 * because Google returns it for transient internal faults; 400/401/403/404
 * are deliberately absent — retrying a bad request or a bad key wastes the
 * request's remaining time and still fails. */
const RETRYABLE_STATUS = new Set([429, 500, 503]);

/** Two extra attempts. Short enough to stay inside the route's budget even
 * when the assistant makes several model calls for one reply. */
const RETRY_DELAYS_MS = [700, 1800];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiProvider implements AiProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new AiProviderUnavailableError("GEMINI_API_KEY is not set");
    }
    this.apiKey = apiKey;
    this.model = process.env.GEMINI_MODEL?.trim() || "gemini-3.6-flash";
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const systemMessage = request.messages.find((m) => m.role === "system");
    const conversationMessages = request.messages.filter((m) => m.role !== "system");

    const body = {
      systemInstruction: systemMessage ? { parts: [{ text: systemMessage.content }] } : undefined,
      contents: conversationMessages.map(toGeminiContent),
      ...(request.tools?.length
        ? { tools: [{ functionDeclarations: request.tools.map(toGeminiFunctionDeclaration) }] }
        : {}),
    };

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    // Google's shared capacity goes away and comes back on its own: a 503
    // says "experiencing high demand ... usually temporary" in as many words,
    // and a 429 is the free tier's per-minute window, which refills. Both were
    // reaching the visitor as "temporarily unavailable" on the first try,
    // which is a worse answer than waiting a second and asking again.
    //
    // Bounded deliberately. Each attempt is a whole model call, the assistant
    // may make several per reply (MAX_TOOL_ROUNDS), and the route has a
    // wall-clock budget — so two extra tries with a short backoff, and only
    // for statuses that mean "not now" rather than "not ever". A 400 or a 403
    // is a bad request or a bad key: retrying those just burns the budget.
    let res: Response | null = null;
    let lastTransient = "";

    for (let attempt = 0; attempt < RETRY_DELAYS_MS.length + 1; attempt++) {
      if (attempt > 0) await sleep(RETRY_DELAYS_MS[attempt - 1]);

      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
      } catch (err) {
        throw new AiProviderUnavailableError(
          `Could not reach Gemini: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      if (res.ok) break;

      const detail = await res.text().catch(() => "");
      // The key travels in the query string, so Google can echo it back in an
      // error body (an invalid-key 400 does). This error is logged by
      // /api/chat, and a key in the logs is a leaked key — so strip it here,
      // the same way embeddingProviders/gemini.ts does.
      const safe =
        `Gemini responded ${res.status}: ${redactKey(detail, this.apiKey).slice(0, 500)}` +
        (explainGeminiStatus(res.status) ?? "");

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
      throw new AiProviderResponseError(`Gemini returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`);
    })) as GeminiGenerateContentResponse;

    const candidate = payload.candidates?.[0];
    if (!candidate) {
      // Blocked by safety filters, or an otherwise empty response — treat as
      // a real (if unhelpful) answer rather than an error, same as an empty
      // Ollama/Anthropic turn; assistant.ts's fallback message covers it.
      console.warn("[ai] Gemini returned no candidates", payload.promptFeedback);
      return { content: "", toolCalls: [] };
    }

    const textParts: string[] = [];
    const toolCalls: AiToolCall[] = [];
    let syntheticIdCounter = 0;

    for (const part of candidate.content?.parts ?? []) {
      if (part.text) {
        textParts.push(part.text);
      } else if (part.functionCall) {
        toolCalls.push({
          // Gemini's id is optional in practice even though the schema
          // allows it — synthesize one if absent so the rest of the app
          // never has to special-case a missing id.
          id: part.functionCall.id || `gemini_call_${syntheticIdCounter++}`,
          name: part.functionCall.name,
          arguments: part.functionCall.args ?? {},
          // Must be replayed on this exact call when the turn is fed back
          // (see toGeminiContent below) — verified: Gemini 400s on a
          // replayed function-call part with this missing.
          providerMetadata: part.thoughtSignature ? { thoughtSignature: part.thoughtSignature } : undefined,
        });
      }
    }

    return { content: textParts.join("\n"), toolCalls };
  }
}

function toGeminiContent(message: Exclude<AiMessage, { role: "system" }>): GeminiContent {
  switch (message.role) {
    case "user":
      return { role: "user", parts: [{ text: message.content }] };
    case "assistant": {
      const parts: GeminiPart[] = [];
      if (message.content) parts.push({ text: message.content });
      for (const call of message.toolCalls ?? []) {
        const meta = call.providerMetadata as { thoughtSignature?: string } | undefined;
        parts.push({
          functionCall: { id: call.id, name: call.name, args: call.arguments },
          ...(meta?.thoughtSignature ? { thoughtSignature: meta.thoughtSignature } : {}),
        });
      }
      return { role: "model", parts };
    }
    case "tool": {
      let response: Record<string, unknown>;
      try {
        response = JSON.parse(message.content) as Record<string, unknown>;
      } catch {
        // Shouldn't happen — assistant.ts always JSON.stringifies tool
        // results before they reach a provider — but Gemini requires an
        // object either way, so fail safe rather than send an invalid body.
        response = { result: message.content };
      }
      return {
        role: "user",
        parts: [{ functionResponse: { id: message.toolCallId, name: message.toolName, response } }],
      };
    }
  }
}

function toGeminiFunctionDeclaration(tool: AiCompletionRequest["tools"] extends (infer T)[] | undefined ? T : never) {
  return {
    name: tool.name,
    description: tool.description,
    parameters: toGeminiSchema(tool.parameters),
  };
}

/** Converts our lowercase-JSON-Schema tool parameters into Gemini's
 * uppercase-typed Schema format — the two field sets are otherwise the same
 * shape (properties/required/description), so this only needs to touch
 * `type`, recursively, not restructure anything else. */
function toGeminiSchema(schema: Record<string, unknown>): Record<string, unknown> {
  const { type, properties, ...rest } = schema;
  const converted: Record<string, unknown> = { ...rest };
  if (typeof type === "string") converted.type = type.toUpperCase();
  if (properties && typeof properties === "object") {
    converted.properties = Object.fromEntries(
      Object.entries(properties as Record<string, Record<string, unknown>>).map(([key, value]) => [
        key,
        toGeminiSchema(value),
      ])
    );
  }
  return converted;
}

type GeminiPart = {
  text?: string;
  functionCall?: { id?: string; name: string; args?: Record<string, unknown> };
  functionResponse?: { id?: string; name: string; response: Record<string, unknown> };
  /** Required on replay when a functionCall part carried one — see the
   * providerMetadata comment in AiToolCall (provider.ts). */
  thoughtSignature?: string;
};

type GeminiContent = { role: "user" | "model"; parts: GeminiPart[] };

type GeminiGenerateContentResponse = {
  candidates?: { content?: GeminiContent; finishReason?: string }[];
  promptFeedback?: unknown;
};

function redactKey(text: string, key: string): string {
  return key ? text.split(key).join("[redacted]") : text;
}
