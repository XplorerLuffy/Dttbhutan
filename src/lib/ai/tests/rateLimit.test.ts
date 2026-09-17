/**
 * Deterministic test for the chat rate limiter (src/lib/ai/rateLimit.ts).
 * Run with: npm run test:ai:ratelimit
 */
import { isChatRateLimited, _resetChatRateLimitForTests } from "@/lib/ai/rateLimit";

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
  _resetChatRateLimitForTests();
  const ip = "203.0.113.42"; // TEST-NET-3, never a real requester

  const results: boolean[] = [];
  for (let i = 0; i < 12; i++) {
    results.push(isChatRateLimited(ip));
  }

  const firstLimitedIndex = results.findIndex((limited) => limited);

  check(
    "the first several messages from one IP are allowed through",
    results.slice(0, 8).every((limited) => limited === false),
    JSON.stringify(results)
  );
  check(
    "repeated rapid requests eventually hit the rate limit",
    firstLimitedIndex !== -1,
    "no request was ever rate-limited across 12 rapid calls"
  );

  const otherIp = "198.51.100.7"; // TEST-NET-2 — a different requester
  check(
    "a different IP is not affected by another IP's rate limit",
    isChatRateLimited(otherIp) === false
  );

  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exit(1);
}

main();
