import "server-only";
import Anthropic from "@anthropic-ai/sdk";
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
 * A hosted-model implementation of the same provider interface Ollama
 * implements — this is what "swap the provider later without rewriting the
 * app" looks like in practice. /api/chat and assistant.ts don't know this
 * file exists; only provider.ts's factory does.
 *
 * Uses the official @anthropic-ai/sdk (not raw fetch, unlike the Ollama
 * provider) — Ollama has no official client worth depending on for one
 * POST, but Anthropic does, and reaching for it is the right call.
 *
 * Model is fixed to Claude Opus 5, current-generation. Server-side refusal
 * fallbacks are enabled (`fallbacks: "default"` on the beta endpoint) so a
 * safety-classifier decline on Opus 5 automatically retries on a fallback
 * model within the same call, per current best practice for this model.
 */
export class AnthropicProvider implements AiProvider {
  private readonly client: Anthropic;
  private readonly model = "claude-opus-5";

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
    if (!apiKey) {
      // Fails at construction, not at request time, so a misconfigured
      // deploy shows up immediately rather than on the first user message.
      throw new AiProviderUnavailableError("ANTHROPIC_API_KEY is not set");
    }
    this.client = new Anthropic({ apiKey });
  }

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    const systemMessage = request.messages.find((m) => m.role === "system");
    const conversationMessages = request.messages.filter(
      (m): m is Exclude<AiMessage, { role: "system" }> => m.role !== "system"
    );

    let response: Anthropic.Beta.Messages.BetaMessage;
    try {
      response = await this.client.beta.messages.create({
        model: this.model,
        max_tokens: 4096,
        output_config: { effort: "low" }, // a chat reply doesn't need deep reasoning
        system: systemMessage?.content,
        messages: toAnthropicMessages(conversationMessages),
        tools: request.tools?.map((tool) => ({
          name: tool.name,
          description: tool.description,
          input_schema: {
            type: "object" as const,
            properties: tool.parameters.properties,
            required: tool.parameters.required,
          },
        })),
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
      });
    } catch (err) {
      if (err instanceof Anthropic.APIConnectionError) {
        throw new AiProviderUnavailableError(`Could not reach Anthropic: ${err.message}`);
      }
      if (err instanceof Anthropic.APIError) {
        throw new AiProviderResponseError(`Anthropic responded with an error: ${err.status} ${err.message}`);
      }
      throw err;
    }

    if (response.stop_reason === "refusal") {
      console.warn("[ai] Anthropic declined the request (refusal)", response.stop_details);
    }

    const textParts: string[] = [];
    const toolCalls: AiToolCall[] = [];

    for (const block of response.content) {
      if (block.type === "text") {
        textParts.push(block.text);
      } else if (block.type === "tool_use") {
        toolCalls.push({
          id: block.id,
          name: block.name,
          arguments: (block.input ?? {}) as Record<string, unknown>,
        });
      }
      // "thinking" blocks are intentionally not surfaced through this
      // provider-neutral interface — Ollama has no equivalent, and the
      // orchestration loop only needs final text + tool calls.
    }

    return { content: textParts.join("\n"), toolCalls };
  }
}

function toAnthropicMessages(
  messages: Exclude<AiMessage, { role: "system" }>[]
): Anthropic.Beta.Messages.BetaMessageParam[] {
  return messages.map((message): Anthropic.Beta.Messages.BetaMessageParam => {
    switch (message.role) {
      case "user":
        return { role: "user", content: message.content };
      case "assistant": {
        const blocks: Anthropic.Beta.Messages.BetaContentBlockParam[] = [];
        if (message.content) blocks.push({ type: "text", text: message.content });
        for (const call of message.toolCalls ?? []) {
          blocks.push({ type: "tool_use", id: call.id, name: call.name, input: call.arguments });
        }
        return { role: "assistant", content: blocks };
      }
      case "tool":
        return {
          role: "user",
          content: [{ type: "tool_result", tool_use_id: message.toolCallId, content: message.content }],
        };
    }
  });
}
