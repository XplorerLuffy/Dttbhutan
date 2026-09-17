/**
 * Deterministic tests for the orchestration loop (src/lib/ai/assistant.ts)
 * using a scripted mock provider — no live Ollama needed. Run with:
 * npm run test:ai:assistant
 *
 * This proves the plumbing: tool calls get executed and fed back in the
 * right shape, history is assembled correctly, and a model that never stops
 * calling tools can't hang the request. It does NOT prove a real model
 * won't hallucinate — see tests/README.md.
 */
import { runAssistantTurn } from "@/lib/ai/assistant";
import { ScriptedMockProvider, InfiniteToolLoopProvider } from "@/lib/ai/tests/mockProvider";
import { prisma } from "@/lib/prisma";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

async function main() {
  // --- Test: model requests a real tool, then answers using its result ---
  const realPackage = await prisma.itinerary.findFirst({
    where: { status: "PUBLISHED" },
    select: { slug: true, pricePerPerson: true },
  });

  if (realPackage) {
    const provider = new ScriptedMockProvider([
      {
        content: "",
        toolCalls: [{ id: "call_0", name: "get_package_details", arguments: { titleOrSlug: realPackage.slug } }],
      },
      { content: "Here's what I found for that package.", toolCalls: [] },
    ]);

    const reply = await runAssistantTurn(provider, [], "What's the price of that package?");

    check("orchestration loop returns the model's final text after a tool round", reply.includes("found"));

    const secondRequest = provider.receivedRequests[1];
    const toolResultMessage = secondRequest.messages.find((m) => m.role === "tool");
    check(
      "the tool result fed back to the model is the real DB price, not a placeholder",
      !!toolResultMessage &&
        toolResultMessage.role === "tool" &&
        JSON.parse(toolResultMessage.content).pricePerPersonBTN === Number(realPackage.pricePerPerson)
    );
    check(
      "the tool result message carries the tool name Ollama's wire format needs",
      toolResultMessage?.role === "tool" && toolResultMessage.toolName === "get_package_details"
    );
  } else {
    console.log("SKIP  no published package in dev DB — run npm run db:seed");
  }

  // --- Test: an infinite tool-calling model cannot hang the request ---
  const loopingProvider = new InfiniteToolLoopProvider();
  const loopReply = await runAssistantTurn(loopingProvider, [], "plan me a trip");
  check(
    "a model that never stops calling tools still gets a bounded number of turns",
    loopingProvider.callCount > 0 && loopingProvider.callCount <= 5,
    `callCount was ${loopingProvider.callCount}`
  );
  check(
    "hitting the round limit returns a safe fallback message, not a crash or empty reply",
    typeof loopReply === "string" && loopReply.length > 0
  );

  // --- Test: conversation continuity — prior turns are included in the
  // request sent to the model, in order, so "I have 7 days" after "I want
  // to visit Bhutan" is understood as the same trip ---
  const continuityProvider = new ScriptedMockProvider([{ content: "Got it — 7 days in Bhutan.", toolCalls: [] }]);
  await runAssistantTurn(
    continuityProvider,
    [
      { role: "USER", content: "I want to visit Bhutan." },
      { role: "ASSISTANT", content: "Great choice! When are you thinking of travelling, and for how long?" },
    ],
    "I have 7 days."
  );

  const sentMessages = continuityProvider.receivedRequests[0].messages;
  const userTurns = sentMessages.filter((m) => m.role === "user").map((m) => m.content);
  check(
    "the earlier 'Bhutan' message is still present when the follow-up 'I have 7 days' arrives",
    userTurns.includes("I want to visit Bhutan.") && userTurns.includes("I have 7 days."),
    JSON.stringify(userTurns)
  );
  check(
    "history is sent in chronological order (earlier turn before the new message)",
    userTurns.indexOf("I want to visit Bhutan.") < userTurns.indexOf("I have 7 days.")
  );

  console.log(`\n${passed}/${passed + failed} checks passed`);
  await prisma.$disconnect();
  if (failed > 0) process.exit(1);
}

main().catch(async (err) => {
  console.error("Test harness crashed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
