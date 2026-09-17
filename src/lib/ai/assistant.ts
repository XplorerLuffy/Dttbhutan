import "server-only";
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";
import { executeTool, getToolDefinitions } from "@/lib/ai/tools";
import type { AiMessage, AiProvider } from "@/lib/ai/provider";

/**
 * The orchestration loop: system prompt + conversation history + tools +
 * provider, wired together. This is the one piece of "business logic" for
 * the assistant — everything it depends on (provider.ts, systemPrompt.ts,
 * tools.ts) is a plain, independently-testable module, and this file's own
 * job is just the loop, so `/api/chat` doesn't have to contain it.
 *
 * The provider is passed in rather than constructed here (dependency
 * injection, not `getAiProvider()` called internally) specifically so
 * tests can run this loop against a scripted mock provider without
 * touching AI_PROVIDER or needing a real Ollama server — see
 * src/lib/ai/tests/.
 */

/** A prior turn as persisted in AiMessage — see prisma/schema.prisma. */
export type ConversationTurn = { role: "USER" | "ASSISTANT"; content: string };

/** Hard ceiling on how many times we'll call the model within one HTTP
 * request while it keeps requesting tools. A well-behaved model finishes in
 * 1-2 rounds; this exists only to guarantee the request terminates instead
 * of looping forever if a model keeps calling tools indefinitely. */
const MAX_TOOL_ROUNDS = 4;

const FALLBACK_REPLY =
  "Sorry, I wasn't able to put together a complete answer for that. Could you try rephrasing, or ask again?";

export async function runAssistantTurn(
  provider: AiProvider,
  history: ConversationTurn[],
  userMessage: string
): Promise<string> {
  const messages: AiMessage[] = [
    { role: "system", content: buildSystemPrompt() },
    ...history.map((turn): AiMessage => ({
      role: turn.role === "USER" ? "user" : "assistant",
      content: turn.content,
    })),
    { role: "user", content: userMessage },
  ];

  const tools = getToolDefinitions();

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const result = await provider.complete({ messages, tools });

    if (result.toolCalls.length === 0) {
      return result.content.trim() || FALLBACK_REPLY;
    }

    // Record the assistant's tool-call turn, then run every requested tool
    // and feed each result back before asking the model to continue. Tool
    // calls within one round run independently of each other, matching how
    // providers that support parallel tool use expect results returned.
    messages.push({ role: "assistant", content: result.content, toolCalls: result.toolCalls });

    for (const call of result.toolCalls) {
      const toolResult = await executeTool(call.name, call.arguments);
      messages.push({
        role: "tool",
        content: JSON.stringify(toolResult),
        toolCallId: call.id,
        toolName: call.name,
      });
    }
  }

  // Exhausted MAX_TOOL_ROUNDS without a final answer — this is the request
  // terminating deliberately, not an error, so it still returns 200 with a
  // safe message rather than surfacing as a failure.
  console.warn("[ai] assistant turn hit MAX_TOOL_ROUNDS without a final answer");
  return FALLBACK_REPLY;
}
