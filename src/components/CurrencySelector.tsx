"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import { CURRENCIES, CurrencyCode } from "@/lib/currency";

/** `compact` is for the header: a globe icon and the three-letter code, nothing else. */
export default function CurrencySelector({
  className,
  compact,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { currency, setCurrency } = useCurrency();

  if (compact) {
    return (
      <label className="relative inline-flex items-center">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
          className="pointer-events-none absolute left-2.5 h-4 w-4 text-brand-900"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
        </svg>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
          aria-label="Display currency"
          title="Currency"
          className={
            className ??
            "cursor-pointer appearance-none rounded-lg border border-brand-900/25 bg-transparent py-1.5 pl-8 pr-2 text-[13px] font-semibold text-brand-900 hover:border-brand-900/60"
          }
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
      </label>
    );
  }

  return (
    <select
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
      aria-label="Display currency"
      className={
        className ??
        "rounded-md border border-stone-300 bg-white px-2 py-1 text-sm text-stone-700 hover:border-stone-400"
      }
    >
      {CURRENCIES.map((c) => (
        <option key={c.code} value={c.code}>
          {c.code} · {c.symbol}
        </option>
      ))}
    </select>
  );
}
