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

    let res: Response;
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

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AiProviderResponseError(`Gemini responded ${res.status}: ${detail.slice(0, 500)}`);
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
