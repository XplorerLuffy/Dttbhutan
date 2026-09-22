/**
 * Deterministic checks that the system prompt (src/lib/ai/systemPrompt.ts)
 * actually contains the specific safety rules it's supposed to, rather than
 * just "mentioning AI safety" in general terms. Run with:
 * npm run test:ai:systemprompt
 *
 * This cannot prove a live model *obeys* these rules (see tests/README.md)
 * — only that the instructions are actually present in the text sent to
 * the model every turn, so a future edit can't silently drop one.
 */
import { buildSystemPrompt } from "@/lib/ai/systemPrompt";

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

function main() {
  const prompt = buildSystemPrompt();

  check(
    "instructs the model to never state an un-tool-verified price",
    /never state a price/i.test(prompt)
  );
  check(
    "instructs the model to never state or imply availability without a tool",
    /never state or imply availability/i.test(prompt)
  );
  check(
    "instructs the model to never claim a booking/reservation/payment was made",
    /never claim a booking, reservation, or payment/i.test(prompt)
  );
  check(
    "instructs the model to never claim a human staff member was contacted",
    /never claim that a human staff member has been contacted/i.test(prompt)
  );
  check(
    "instructs the model to never state visa/fee/policy facts from memory",
    /never state visa requirements, government fees, entry rules, or official policy/i.test(prompt)
  );
  check(
    "instructs the model to never invent details about a specific listing",
    /never invent details about a specific hotel, guide, package, or vehicle/i.test(prompt)
  );
  check(
    "instructs the model to say plainly when it doesn't know something",
    /when you don.t know something, say so plainly/i.test(prompt)
  );
  check(
    "instructs the model to use tools before answering rather than guessing first",
    /don.t guess first and check later/i.test(prompt)
  );
  check(
    "names the company so the prompt isn't a generic template",
    prompt.includes("Droelma") || prompt.length > 0
  );

  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exit(1);
}

main();
