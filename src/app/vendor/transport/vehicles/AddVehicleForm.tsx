"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddVehicleForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/vendors/transport/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: form.get("type"),
        capacity: form.get("capacity"),
        plateNumber: form.get("plateNumber"),
        driverName: form.get("driverName"),
        driverLicenseNumber: form.get("driverLicenseNumber"),
        ratePerDay: form.get("ratePerDay"),
        ratePerKm: form.get("ratePerKm") || undefined,
        gpsDeviceIdentifier: form.get("gpsDeviceIdentifier") || undefined,
      }),
    });

    setIsSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Could not add vehicle");
      return;
    }

    (e.target as HTMLFormElement).reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        + Add vehicle
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <select name="type" required className="input">
          <option value="SEDAN">Sedan</option>
          <option value="SUV">SUV</option>
          <option value="VAN">Van</option>
          <option value="BUS">Bus</option>
        </select>
        <input name="capacity" type="number" min={1} placeholder="Capacity" required className="input" />
        <input name="plateNumber" placeholder="Plate number" required className="input" />
        <input name="driverName" placeholder="Driver name" required className="input" />
        <input name="driverLicenseNumber" placeholder="Driver license #" required className="input" />
        <input name="ratePerDay" type="number" min={1} step="0.01" placeholder="Rate/day (BTN)" required className="input" />
        <input name="ratePerKm" type="number" min={0} step="0.01" placeholder="Rate/km (optional)" className="input" />
        <input name="gpsDeviceIdentifier" placeholder="GPS device ID (optional)" className="input" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Adding..." : "Add vehicle"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
