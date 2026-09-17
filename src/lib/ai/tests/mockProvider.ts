import type { AiCompletionRequest, AiCompletionResult, AiProvider } from "@/lib/ai/provider";

/**
 * A scripted AiProvider for tests. This is NOT a "does the LLM actually
 * behave" test double — no mock can answer that, since compliance with the
 * system prompt is a property of the real model, not of code. What this
 * lets us test deterministically is everything *around* the model: does the
 * orchestration loop call tools correctly, feed results back in the right
 * shape, respect the round limit, and assemble conversation history
 * correctly. See tests/README.md for the full reasoning on what is and
 * isn't testable without a live model.
 *
 * Usage: construct with an array of responses; each call to `complete()`
 * returns the next one in sequence (and records the request it received).
 */
export class ScriptedMockProvider implements AiProvider {
  public readonly receivedRequests: AiCompletionRequest[] = [];
  private step = 0;

  constructor(private readonly responses: AiCompletionResult[]) {}

  async complete(request: AiCompletionRequest): Promise<AiCompletionResult> {
    this.receivedRequests.push(request);
    const response = this.responses[this.step];
    this.step++;
    if (!response) {
      throw new Error(`ScriptedMockProvider ran out of scripted responses at step ${this.step}`);
    }
    return response;
  }
}

/** Always requests the same tool call, forever — used to prove the
 * orchestration loop's round limit actually terminates the request instead
 * of hanging or crashing. */
export class InfiniteToolLoopProvider implements AiProvider {
  public callCount = 0;

  async complete(): Promise<AiCompletionResult> {
    this.callCount++;
    return {
      content: "",
      toolCalls: [{ id: "call_0", name: "search_destinations", arguments: {} }],
    };
  }
}
