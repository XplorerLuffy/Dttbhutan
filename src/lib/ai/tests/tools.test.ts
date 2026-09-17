/**
 * Deterministic tests for the grounding tools against the real dev
 * database. No test framework is installed in this project (no jest/vitest
 * in package.json) — this runs as a plain script via `tsx`, the same way
 * prisma/seed.ts does. Run with: npm run test:ai:tools
 *
 * These tests cover exactly the "must never invent a price" requirement at
 * the layer where it's actually enforceable deterministically: whether the
 * application correctly returns a real price or an explicit not-found
 * result. Whether an LLM *obeys* the system prompt is a separate, inherently
 * non-deterministic question — see tests/README.md.
 */
import { executeTool } from "@/lib/ai/tools";
import { getCurrentRates } from "@/lib/fx";
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
  // --- Test 1: a real, existing package returns its real price ---
  const realPackage = await prisma.itinerary.findFirst({
    where: { status: "PUBLISHED" },
    select: { title: true, slug: true, pricePerPerson: true },
  });

  if (!realPackage) {
    console.log("SKIP  no published package in the dev DB to test against — run npm run db:seed");
  } else {
    const result = await executeTool("get_package_details", { titleOrSlug: realPackage.slug });
    check(
      "get_package_details returns found:true for a real package",
      result.found === true,
      JSON.stringify(result)
    );
    check(
      "get_package_details returns the exact DB price, not a computed/guessed one",
      result.found === true && result.pricePerPersonBTN === Number(realPackage.pricePerPerson),
      `expected ${realPackage.pricePerPerson}, got ${JSON.stringify(result.pricePerPersonBTN)}`
    );
  }

  // --- Test 2: a package that does not exist returns an explicit not-found,
  // never a fabricated price ---
  const fakeSlug = "definitely-not-a-real-package-xyz-123";
  const notFoundResult = await executeTool("get_package_details", { titleOrSlug: fakeSlug });
  check(
    "get_package_details returns found:false for a nonexistent package",
    notFoundResult.found === false,
    JSON.stringify(notFoundResult)
  );
  check(
    "the not-found result carries no price field at all",
    !("pricePerPersonBTN" in notFoundResult),
    JSON.stringify(notFoundResult)
  );

  // --- Test 3: search_guides returns real rates for approved guides only ---
  const guides = await executeTool("search_guides", {});
  if (guides.found) {
    const guideList = guides.guides as { ratePerDayBTN: number }[];
    check(
      "search_guides returns at least one guide with a numeric real rate",
      guideList.length > 0 && typeof guideList[0].ratePerDayBTN === "number",
      JSON.stringify(guides)
    );

    const dbApprovedCount = await prisma.guideProfile.count({ where: { status: "APPROVED" } });
    check(
      "search_guides never returns more guides than actually exist as APPROVED",
      guideList.length <= dbApprovedCount
    );
  } else {
    console.log("SKIP  no approved guides in dev DB — run npm run db:seed");
  }

  // --- Test 4: an unsupported currency is rejected, not silently converted ---
  const badCurrency = await executeTool("convert_price", { amountBTN: 1000, targetCurrency: "ZZZ" });
  check(
    "convert_price rejects an unsupported currency instead of guessing a rate",
    badCurrency.found === false,
    JSON.stringify(badCurrency)
  );

  // --- Test 5: a real currency conversion uses the site's actual stored rate ---
  //
  // convert_price calls the existing src/lib/fx.ts#getCurrentRates(), which
  // wraps its query in Next.js's unstable_cache() — that requires the real
  // Next.js server runtime's incremental-cache machinery, which only exists
  // inside `next dev`/`next start`, not a bare tsx script. That's a property
  // of this test *environment*, not a bug: /api/chat always runs inside a
  // real Next.js server process, where this works normally. Probe directly
  // (bypassing executeTool's error-swallowing) so this is a clean skip
  // rather than a false failure — see tests/README.md for the live-server
  // check that covers this path for real.
  let runtimeSupportsUnstableCache = true;
  try {
    await getCurrentRates();
  } catch (err) {
    if (err instanceof Error && err.message.includes("incrementalCache")) {
      runtimeSupportsUnstableCache = false;
    } else {
      throw err;
    }
  }

  if (!runtimeSupportsUnstableCache) {
    console.log(
      "SKIP  convert_price real-rate check — getCurrentRates() needs the Next.js server runtime" +
        " (unstable_cache), not available under a plain script; verified instead via a live" +
        " `next dev` request, see tests/README.md"
    );
  } else {
    const rates = await prisma.exchangeRate.findFirst({ where: { currency: "USD" } });
    const usdConversion = await executeTool("convert_price", { amountBTN: 1000, targetCurrency: "USD" });
    if (rates) {
      const expected = Number((1000 / Number(rates.btnPerUnit)).toFixed(2));
      check(
        "convert_price matches the ExchangeRate table exactly, not an invented rate",
        usdConversion.found === true && usdConversion.convertedAmount === expected,
        `expected ${expected}, got ${JSON.stringify(usdConversion.convertedAmount)}`
      );
    } else {
      check(
        "convert_price still returns a real number via the documented fallback when no DB rate exists",
        usdConversion.found === true && typeof usdConversion.convertedAmount === "number"
      );
    }
  }

  // --- Test 6: unknown tool name fails closed, not silently ---
  const unknownTool = await executeTool("delete_all_bookings", {});
  check(
    "executeTool refuses an unknown tool name rather than doing nothing silently",
    unknownTool.found === false && typeof unknownTool.reason === "string"
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
