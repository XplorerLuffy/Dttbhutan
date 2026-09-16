import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { CurrencyCode } from "@/lib/currency";

/**
 * Used only if the ExchangeRate table has no row yet for a currency (e.g.
 * right after a fresh deploy, before the first scheduled refresh has run).
 * Once the cron job populates the table, these are never consulted again
 * for that currency.
 */
export const FALLBACK_BTN_PER_UNIT: Record<Exclude<CurrencyCode, "BTN">, number> = {
  INR: 1,
  USD: 95.98,
  EUR: 110.72,
  GBP: 129.23,
  AUD: 68.47,
};

const LIVE_CURRENCIES = ["USD", "EUR", "GBP", "AUD"] as const;

/**
 * Rates only ever change once a day (the cron job) or on an admin's
 * manual "Refresh now" click (which calls revalidateTag below) — so
 * there's no reason for every single page navigation, including ones
 * that never display a price, to pay for a DB round trip here. Every
 * page in the app awaits this from the root layout, so an uncached
 * query here was adding real latency to every admin page load too.
 */
const getStoredRates = unstable_cache(
  async () => {
    const rows = await prisma.exchangeRate.findMany();
    return rows.map((r) => [r.currency, Number(r.btnPerUnit)] as const);
  },
  ["exchange-rates"],
  { revalidate: 300, tags: ["exchange-rates"] }
);

/**
 * Reads the exchange rates the site currently shows, DB first and falling
 * back to the hardcoded defaults for any currency that's never been
 * fetched. BTN is always 1 (it's the base unit everything else is stored
 * and charged in) and INR is always 1 (pegged to BTN by Bhutan's Royal
 * Monetary Authority) — neither needs a DB row.
 */
export async function getCurrentRates(): Promise<Record<CurrencyCode, number>> {
  const rows = await getStoredRates();
  const byCurrency = new Map(rows);

  return {
    BTN: 1,
    INR: 1,
    USD: byCurrency.get("USD") ?? FALLBACK_BTN_PER_UNIT.USD,
    EUR: byCurrency.get("EUR") ?? FALLBACK_BTN_PER_UNIT.EUR,
    GBP: byCurrency.get("GBP") ?? FALLBACK_BTN_PER_UNIT.GBP,
    AUD: byCurrency.get("AUD") ?? FALLBACK_BTN_PER_UNIT.AUD,
  };
}

/**
 * Fetches live rates (INR as base, since BTN is pegged 1:1 to it) from
 * Frankfurter — a free, keyless API backed by the ECB's daily reference
 * rates — and upserts them into ExchangeRate. Called by the scheduled
 * /api/cron/fx-rates route, and can also be triggered manually from the
 * admin exchange-rates page.
 *
 * Note this pulls the raw interbank/ECB reference rate, which typically
 * sits a little below what a bank or money-changer would actually quote
 * (retail rates carry a margin) — it's a live, automatically-moving
 * number, not necessarily identical to a specific vendor's counter rate.
 */
export async function refreshRatesFromLiveSource(): Promise<{
  updated: CurrencyCode[];
  failed: CurrencyCode[];
}> {
  const updated: CurrencyCode[] = [];
  const failed: CurrencyCode[] = [];

  let payload: { rates?: Record<string, number> };
  try {
    const res = await fetch(
      `https://api.frankfurter.app/latest?from=INR&to=${LIVE_CURRENCIES.join(",")}`,
      { cache: "no-store" }
    );
    if (!res.ok) throw new Error(`Frankfurter responded ${res.status}`);
    payload = await res.json();
  } catch (err) {
    console.error("fx: failed to fetch live rates", err);
    return { updated, failed: [...LIVE_CURRENCIES] };
  }

  for (const currency of LIVE_CURRENCIES) {
    const inrToCurrency = payload.rates?.[currency];
    if (!inrToCurrency || inrToCurrency <= 0) {
      failed.push(currency);
      continue;
    }
    const btnPerUnit = 1 / inrToCurrency;
    await prisma.exchangeRate.upsert({
      where: { currency },
      create: { currency, btnPerUnit, source: "frankfurter.app" },
      update: { btnPerUnit, source: "frankfurter.app" },
    });
    updated.push(currency);
  }

  if (updated.length > 0) revalidateTag("exchange-rates");

  return { updated, failed };
}
