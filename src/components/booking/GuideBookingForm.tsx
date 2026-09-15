"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function GuideBookingForm({ guideId }: { guideId: string }) {
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
        type: "GUIDE",
        guideId,
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
      }),
    });

    setIsSubmitting(false);

    if (res.status === 401) {
      setNeedsLogin(true);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not create booking");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-semibold">Book this guide</h3>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium">Start date</label>
          <input name="startDate" type="date" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">End date</label>
          <input name="endDate" type="date" required className="input" />
        </div>
      </div>

      {needsLogin && (
        <p className="text-sm text-amber-700">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          as a traveler to book.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Booking..." : "Request booking"}
      </button>
    </form>
  );
}
