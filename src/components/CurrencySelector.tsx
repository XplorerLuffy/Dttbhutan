"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import { CURRENCIES, CurrencyCode } from "@/lib/currency";

export default function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

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
