"use client";

import { useCurrency } from "@/components/CurrencyProvider";
import { formatCurrency } from "@/lib/currency";

/**
 * Renders an amount stored in BTN (the app's real transactional currency)
 * converted to the viewer's chosen display currency. When the viewer picks
 * a currency other than BTN, the original BTN amount is shown alongside in
 * smaller text — bookings are still charged in BTN, so travelers comparing
 * prices in their home currency can see the real figure too.
 */
export default function Money({ btn, className }: { btn: number; className?: string }) {
  const { currency, rates } = useCurrency();

  // BTN and INR are pegged 1:1, so the parenthetical BTN reference below
  // would just repeat the same number for INR — skip it for both.
  if (currency === "BTN" || currency === "INR") {
    return <span className={className}>{formatCurrency(btn, currency, rates)}</span>;
  }

  return (
    <span className={className}>
      {formatCurrency(btn, currency, rates)}
      <span className="ml-1 text-[0.75em] font-normal text-stone-400">
        ({formatCurrency(btn, "BTN", rates)})
      </span>
    </span>
  );
}
