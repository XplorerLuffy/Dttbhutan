"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { FlightOffer } from "@/lib/flights/aggregator";

export default function FlightBookingButton({ offer }: { offer: FlightOffer }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleBook() {
    setError(null);
    setNeedsLogin(false);
    setIsSubmitting(true);

    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "FLIGHT", offer }),
    });

    setIsSubmitting(false);

    if (res.status === 401) {
      setNeedsLogin(true);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not book this flight");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="text-right">
      <button type="button" onClick={handleBook} disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Booking..." : `Book · Nu. ${offer.totalPrice.toLocaleString()}`}
      </button>
      {needsLogin && (
        <p className="mt-1 text-xs text-amber-700">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          as a traveler to book.
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
