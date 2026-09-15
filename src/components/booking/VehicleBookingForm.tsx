"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function VehicleBookingForm({ vehicleId }: { vehicleId: string }) {
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
        type: "VEHICLE",
        vehicleId,
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        plannedDistanceKm: form.get("plannedDistanceKm"),
        plannedRoute: [
          {
            label: String(form.get("fromLabel") ?? "Start"),
            latitude: Number(form.get("fromLat")),
            longitude: Number(form.get("fromLng")),
          },
          {
            label: String(form.get("toLabel") ?? "End"),
            latitude: Number(form.get("toLat")),
            longitude: Number(form.get("toLng")),
          },
        ],
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
      <h3 className="font-semibold">Book this vehicle</h3>
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

      <p className="text-xs text-stone-500">
        Enter the agreed route below. This becomes the &ldquo;planned&rdquo;
        distance the driver&apos;s GPS trail is checked against once the
        trip runs.
      </p>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <input name="fromLabel" placeholder="From (e.g. Paro)" required className="input" />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="fromLat"
              type="number"
              step="any"
              placeholder="Lat"
              required
              className="input"
            />
            <input
              name="fromLng"
              type="number"
              step="any"
              placeholder="Lng"
              required
              className="input"
            />
          </div>
        </div>
        <div className="space-y-2">
          <input name="toLabel" placeholder="To (e.g. Thimphu)" required className="input" />
          <div className="grid grid-cols-2 gap-2">
            <input
              name="toLat"
              type="number"
              step="any"
              placeholder="Lat"
              required
              className="input"
            />
            <input
              name="toLng"
              type="number"
              step="any"
              placeholder="Lng"
              required
              className="input"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          Planned/quoted distance (km)
        </label>
        <input
          name="plannedDistanceKm"
          type="number"
          min={1}
          step="0.1"
          required
          className="input"
        />
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
