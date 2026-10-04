"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, readError, nullableNumber } from "@/components/admin/vendorFormFields";

const VEHICLE_TYPES = ["SEDAN", "SUV", "VAN", "BUS"] as const;

export default function VehicleEditForm({
  vehicleId,
  initial,
}: {
  vehicleId: string;
  initial: {
    type: string;
    capacity: number;
    plateNumber: string;
    driverName: string;
    driverLicenseNumber: string;
    ratePerDay: string;
    ratePerKm: string;
  };
}) {
  const router = useRouter();

  const [type, setType] = useState(initial.type);
  const [capacity, setCapacity] = useState(String(initial.capacity));
  const [plateNumber, setPlateNumber] = useState(initial.plateNumber);
  const [driverName, setDriverName] = useState(initial.driverName);
  const [driverLicenseNumber, setDriverLicenseNumber] = useState(initial.driverLicenseNumber);
  const [ratePerDay, setRatePerDay] = useState(initial.ratePerDay);
  const [ratePerKm, setRatePerKm] = useState(initial.ratePerKm);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch(`/api/admin/vehicles/${vehicleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type,
        capacity,
        plateNumber,
        driverName,
        driverLicenseNumber,
        ratePerDay,
        ratePerKm: nullableNumber(ratePerKm),
      }),
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setError(readError(await res.json().catch(() => ({}))));
      return;
    }
    router.push("/chim/vendors");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Vehicle type">
          <select value={type} onChange={(e) => setType(e.target.value)} className="input">
            {VEHICLE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Passenger capacity">
          <input
            value={capacity}
            onChange={(e) => setCapacity(e.target.value)}
            inputMode="numeric"
            required
            className="input"
          />
        </Field>
      </div>

      <Field label="Plate number">
        <input
          value={plateNumber}
          onChange={(e) => setPlateNumber(e.target.value)}
          required
          className="input"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Driver name">
          <input
            value={driverName}
            onChange={(e) => setDriverName(e.target.value)}
            required
            className="input"
          />
        </Field>
        <Field label="Driver licence number">
          <input
            value={driverLicenseNumber}
            onChange={(e) => setDriverLicenseNumber(e.target.value)}
            required
            className="input"
          />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Rate per day (BTN)">
          <input
            value={ratePerDay}
            onChange={(e) => setRatePerDay(e.target.value)}
            inputMode="decimal"
            required
            className="input"
          />
        </Field>
        <Field label="Rate per km (BTN, optional)">
          <input
            value={ratePerKm}
            onChange={(e) => setRatePerKm(e.target.value)}
            inputMode="decimal"
            className="input"
          />
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Saving..." : "Save changes"}
      </button>
    </form>
  );
}
