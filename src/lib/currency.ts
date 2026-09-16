export type CurrencyCode = "BTN" | "USD" | "AUD" | "INR" | "EUR" | "GBP";

export const DEFAULT_CURRENCY: CurrencyCode = "BTN";

/**
 * How many BTN equal one unit of each currency. BTN and INR are pegged
 * 1:1 by Bhutan's Royal Monetary Authority, so that one is exact; the
 * rest are indicative market rates, not a live feed (this app has no FX
 * data source), and are only for browsing/comparison — every booking is
 * still charged in BTN at the prevailing rate on the day.
 */
export const BTN_PER_UNIT: Record<CurrencyCode, number> = {
  BTN: 1,
  INR: 1,
  USD: 84,
  EUR: 91,
  GBP: 106,
  AUD: 55,
};

export const CURRENCIES: { code: CurrencyCode; label: string; symbol: string }[] = [
  { code: "BTN", label: "Ngultrum", symbol: "Nu." },
  { code: "USD", label: "US Dollar", symbol: "$" },
  { code: "AUD", label: "Australian Dollar", symbol: "A$" },
  { code: "INR", label: "Indian Rupee", symbol: "₹" },
  { code: "EUR", label: "Euro", symbol: "€" },
  { code: "GBP", label: "British Pound", symbol: "£" },
];

export function convertFromBTN(amountBTN: number, currency: CurrencyCode): number {
  return amountBTN / BTN_PER_UNIT[currency];
}

export function formatCurrency(amountBTN: number, currency: CurrencyCode): string {
  const symbol = CURRENCIES.find((c) => c.code === currency)?.symbol ?? currency;
  const value = convertFromBTN(amountBTN, currency);
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
