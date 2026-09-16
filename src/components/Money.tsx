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
  const { currency } = useCurrency();

  if (currency === "BTN") {
    return <span className={className}>{formatCurrency(btn, "BTN")}</span>;
  }

  return (
    <span className={className}>
      {formatCurrency(btn, currency)}
      <span className="ml-1 text-[0.75em] font-normal text-stone-400">({formatCurrency(btn, "BTN")})</span>
    </span>
  );
}
