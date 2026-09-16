export type CurrencyCode = "BTN" | "USD" | "AUD" | "INR" | "EUR" | "GBP";

export const DEFAULT_CURRENCY: CurrencyCode = "BTN";

/** How many BTN equal one unit of each currency, keyed by currency code. */
export type RateMap = Record<CurrencyCode, number>;

/**
 * Used only for the very first client render before the server-fetched
 * rates (passed down from the root layout) are available, and in the rare
 * case a page renders <Money> outside the provider. The real numbers
 * always come from the database via getCurrentRates() in src/lib/fx.ts,
 * refreshed automatically by a scheduled job — these are not what's shown
 * once the app has mounted.
 */
export const CLIENT_DEFAULT_RATES: RateMap = {
  BTN: 1,
  INR: 1,
  USD: 95.98,
  EUR: 110.72,
  GBP: 129.23,
  AUD: 68.47,
};

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "BTN", label: "Ngultrum", symbol: "Nu." },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
];

export function convertFromBTN(amountBTN: number, currency: CurrencyCode, rates: RateMap): number {
  return amountBTN / rates[currency];
}

export function formatCurrency(amountBTN: number, currency: CurrencyCode, rates: RateMap): string {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  const value = convertFromBTN(amountBTN, currency, rates);
  // BTN/INR are whole-number-friendly in this app's price ranges; other
  // currencies convert to smaller numbers where a couple of decimals reads
  // more naturally (e.g. $30.14 rather than $30).
  const decimals = currency === "BTN" || currency === "INR" ? 0 : 2;
  const formattedValue = value.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  // "Nu." is a multi-letter abbreviation and reads oddly glued to the
  // number ("Nu.3,200"); single-glyph symbols ($, €, £, ₹, A$) don't need
  // the extra space.
  const separator = currency === "BTN" ? " " : "";
  return `${symbol}${separator}${formattedValue}`;
}
