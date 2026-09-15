"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ItineraryBookingForm({
  itineraryId,
  maxGroupSize,
}: {
  itineraryId: string;
  maxGroupSize: number | null;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setNeedsLogin(false);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "ITINERARY",
        itineraryId,
        startDate: form.get("startDate"),
        travelers: form.get("travelers"),
        notes: form.get("notes") || undefined,
      }),
    });

    setIsSubmitting(false);

    if (res.status === 401) {
      setNeedsLogin(true);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not request this package");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-semibold">Book this package</h3>
      <div>
        <label className="mb-1 block text-sm font-medium">Preferred start date</label>
        <input name="startDate" type="date" required className="input" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Travelers</label>
        <input
          name="travelers"
          type="number"
          min={1}
          max={maxGroupSize ?? 30}
          defaultValue={2}
          required
          className="input"
        />
        {maxGroupSize && <p className="mt-1 text-xs text-stone-400">Max group size: {maxGroupSize}</p>}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">Notes (optional)</label>
        <textarea name="notes" rows={3} placeholder="Dietary needs, special occasions, etc." className="input" />
      </div>

      <p className="text-xs text-stone-500">
        This sends a booking request — our team will confirm your guide, hotel, and vehicle and follow up.
      </p>

      {needsLogin && (
        <p className="text-sm text-amber-700">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          as a traveler to request this package.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Sending..." : "Request booking"}
      </button>
    </form>
  );
}
