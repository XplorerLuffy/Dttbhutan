import "server-only";
import { OllamaProvider } from "./providers/ollama";

/**
 * LLM provider abstraction.
 *
 * Everything in this file is provider-neutral on purpose: `/api/chat` and
 * the assistant orchestration loop (`src/lib/ai/assistant.ts`) only ever
 * import `AiProvider` and `getAiProvider()` from here — never a concrete
 * implementation. Swapping Ollama for a hosted model later (Anthropic,
 * OpenAI, whatever) means adding one file under `providers/` and one line
 * in the factory switch below. No other file changes.
 *
 * The shapes here are intentionally close to the common "OpenAI-style"
 * chat-with-tools shape (system/user/assistant/tool roles, JSON-schema tool
 * definitions, name+arguments tool calls) because that's what every
 * provider we're likely to add — Ollama, Anthropic, OpenAI — can be mapped
 * to or from without contorting the interface.
 */

export type AiToolCall = {
  /**
   * Correlates a tool call with its result. Some providers (Anthropic,
   * OpenAI) issue a real id; Ollama doesn't, so the Ollama provider
   * synthesizes one (see providers/ollama.ts). Callers should treat this as
   * an opaque string, not assume a particular format.
   */
  id: string;
  name: string;
  arguments: Record<string, unknown>;
};

export type AiMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string; toolCalls?: AiToolCall[] }
  | { role: "tool"; content: string; toolCallId: string; toolName: string };

/** A tool advertised to the model, described as a JSON Schema function — the
 * same shape Ollama, OpenAI, and (with minor renaming) Anthropic all use. */
export type AiToolDefinition = {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
};

export type AiCompletionRequest = {
  messages: AiMessage[];
  tools?: AiToolDefinition[];
};

export type AiCompletionResult = {
  /** Assistant text for this turn. Empty when the turn is purely tool calls
   * (mirrors what Ollama itself returns: `content: ""` alongside tool_calls). */
  content: string;
  toolCalls: AiToolCall[];
};

export interface AiProvider {
  /**
   * One request/response round trip. The orchestration loop in
   * assistant.ts is responsible for feeding tool results back in and
   * calling this again — a provider never loops on its own.
   *
   * Streaming is intentionally not part of this interface yet (Phase 1
   * priority is a correct non-streaming flow). When it's added, it'll be a
   * second method — e.g. `completeStream(request): AsyncIterable<...>` —
   * alongside this one, not a replacement for it, so existing callers are
   * unaffected.
   */
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

/** Thrown when the provider's backing service can't be reached at all
 * (connection refused, DNS failure, timeout) — as opposed to the service
 * responding with an error. `/api/chat` maps this to a safe, generic
 * user-facing message and logs the real cause server-side only. */
export class AiProviderUnavailableError extends Error {}

/** Thrown when the provider's backing service responded, but with an error
 * (bad request, model not found, non-2xx status). Distinct from
 * AiProviderUnavailableError so logs can tell "it's down" apart from "we're
 * calling it wrong" — both still surface the same safe message to the user. */
export class AiProviderResponseError extends Error {}

export type AiProviderName = "ollama";

/**
 * Selects the provider from AI_PROVIDER (see .env.example). This is the
 * only place that branches on provider name — everything downstream just
 * holds an `AiProvider` and calls `.complete()`.
 */
export function getAiProvider(): AiProvider {
  const name = (process.env.AI_PROVIDER?.trim() || "ollama") as AiProviderName;

  switch (name) {
    case "ollama":
      return new OllamaProvider();
    default: {
      const exhaustiveCheck: never = name;
      throw new Error(`Unknown AI_PROVIDER: ${exhaustiveCheck}`);
    }
  }
}
