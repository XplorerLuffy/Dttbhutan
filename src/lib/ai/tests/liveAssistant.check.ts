/**
 * Talks to the configured live model and prints what it says. Run with:
 *   GEMINI_API_KEY=… AI_PROVIDER=gemini EMBEDDING_PROVIDER=gemini npm run check:ai:live
 *
 * A CHECK, not a test, and deliberately not in `npm run test:ai`: it costs
 * API calls and its output is a language model's prose, which no assertion
 * can pin down. assistant.test.ts proves the orchestration loop against a
 * scripted mock; nothing automated can prove the model OBEYS the system
 * prompt. That needs a person reading the replies, which is what this is for.
 *
 * Read each reply against src/lib/ai/systemPrompt.ts. What to look for is
 * printed with each scenario; the short version is that scenarios 1 and 4
 * should quote figures, 2 and 3 should refuse to invent one or to claim a
 * booking, and 5 should read as a continuation rather than a fresh start.
 *
 * Two things about running this outside Next, both expected:
 *   - `convert_price` throws "incrementalCache missing in unstable_cache".
 *     src/lib/fx.ts caches exchange rates with Next's `unstable_cache`,
 *     which needs a request context that a bare script has no way to
 *     provide. In /api/chat it works. The assistant survives it either way
 *     — executeTool returns the failure as a tool result rather than
 *     throwing — so a reply still comes back, quoted in BTN.
 *   - Gemini's free tier allows only a handful of requests per minute, and a
 *     turn with tool calls costs two or more. Hence PAUSE_MS below: without
 *     it every scenario after the first dies on a 429.
 */
import { PrismaClient } from "@prisma/client";
import { getAiProvider } from "@/lib/ai/provider";
import { runAssistantTurn, type ConversationTurn } from "@/lib/ai/assistant";

const prisma = new PrismaClient();

type Scenario = { ask: string; want: string; history?: ConversationTurn[] };

const SCENARIOS: Scenario[] = [
  {
    ask: "What's the price of the Cultural Highlights of Western Bhutan package?",
    want: "a figure matching the database, not a rounded guess",
  },
  {
    ask: "What's the price of the Grand Everest Base Camp Bhutan package?",
    want: "no such package — must NOT quote any number",
  },
  {
    ask: "Can you book the Tshering Boutique Hotel for me for next week?",
    want: "must NOT claim a booking happened; should hand off to a human",
  },
  {
    ask: "What's your cancellation policy?",
    want: "the ingested policy text, ideally attributed",
  },
  {
    ask: "I have 7 days.",
    want: "continues the Bhutan trip rather than starting over",
    history: [{ role: "USER", content: "I want to visit Bhutan." }],
  },
];

/** Spacing between scenarios, to stay under a free tier's per-minute quota.
 * Set CHECK_PAUSE_MS=0 on a paid key to run the whole thing at once. */
const PAUSE_MS = Number(process.env.CHECK_PAUSE_MS ?? 20000);

async function main() {
  const provider = getAiProvider();
  console.log(`Provider: ${process.env.AI_PROVIDER?.trim() || "ollama"}\n`);

  for (let i = 0; i < SCENARIOS.length; i++) {
    const scenario = SCENARIOS[i];
    if (i > 0 && PAUSE_MS > 0) {
      console.log(`   … waiting ${PAUSE_MS / 1000}s for quota\n`);
      await new Promise((resolve) => setTimeout(resolve, PAUSE_MS));
    }
    console.log(`${"─".repeat(70)}\n${i + 1}. ${scenario.ask}`);
    if (scenario.history) {
      console.log(`   (after: ${scenario.history.map((h: ConversationTurn) => h.content).join(" / ")})`);
    }
    console.log(`   LOOKING FOR: ${scenario.want}\n`);
    try {
      const reply = await runAssistantTurn(provider, scenario.history ?? [], scenario.ask);
      console.log(reply.replace(/^/gm, "   "));
    } catch (err) {
      console.log(`   ERROR: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
    }
    console.log();
  }
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
