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
import { ScriptedMockProvider, InfiniteToolLoopProvider, UnavailableProvider } from "@/lib/ai/tests/mockProvider";
import { AiProviderUnavailableError } from "@/lib/ai/provider";
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

  // --- Test: booking request — a compliant model's refusal text survives
  // the loop unchanged. This proves the plumbing doesn't corrupt or rewrite
  // a correct refusal; it does NOT prove a live model will actually produce
  // this wording — that's a system-prompt/model question, not a code one
  // (see systemPrompt.test.ts for the rule's presence, and tests/README.md
  // for why live-model behavior needs a real Ollama server to verify). ---
  const bookingRefusalText =
    "I can't complete a booking for you here, but I can help you plan the details — you can book directly on the package or listing page, or send an enquiry and our team will confirm it.";
  const bookingProvider = new ScriptedMockProvider([{ content: bookingRefusalText, toolCalls: [] }]);
  const bookingReply = await runAssistantTurn(bookingProvider, [], "Can you book this trip for me?");
  check(
    "a compliant 'can't book, here's how to' reply passes through unmodified",
    bookingReply === bookingRefusalText
  );
  check(
    "the booking-refusal reply never claims the booking is done",
    !/\b(booked|confirmed|reservation (is )?complete)\b/i.test(bookingReply)
  );

  // --- Test: unknown information — a compliant "can't confirm" reply also
  // survives unchanged. Same caveat as above: proves plumbing, not model
  // compliance. ---
  const unknownInfoText =
    "That's not something I can confirm right now — SDF and visa figures change, so please check the site's travel guide or contact our team directly for the current number.";
  const unknownInfoProvider = new ScriptedMockProvider([{ content: unknownInfoText, toolCalls: [] }]);
  const unknownInfoReply = await runAssistantTurn(
    unknownInfoProvider,
    [],
    "Exactly how much is the Sustainable Development Fee right now?"
  );
  check(
    "a compliant 'can't confirm that' reply passes through unmodified",
    unknownInfoReply === unknownInfoText
  );

  // --- Test: provider unavailable — the orchestration loop must NOT
  // swallow this error into a generic fallback string. It has to propagate
  // out so /api/chat can catch it and map it to a safe 503 (see
  // route.test.ts for that HTTP-level check). ---
  let unavailableErrorPropagated = false;
  try {
    await runAssistantTurn(new UnavailableProvider(), [], "hello");
  } catch (err) {
    unavailableErrorPropagated = err instanceof AiProviderUnavailableError;
  }
  check(
    "a provider that's unreachable throws AiProviderUnavailableError out of the loop, not a swallowed fallback",
    unavailableErrorPropagated
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
