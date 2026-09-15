"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TransportRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      operator: {
        businessName: form.get("businessName"),
        businessLicenseUrl: form.get("businessLicenseUrl") || undefined,
      },
      vehicle: {
        type: form.get("type"),
        capacity: form.get("capacity"),
        plateNumber: form.get("plateNumber"),
        driverName: form.get("driverName"),
        driverLicenseNumber: form.get("driverLicenseNumber"),
        ratePerDay: form.get("ratePerDay"),
        ratePerKm: form.get("ratePerKm") || undefined,
        gpsDeviceIdentifier: form.get("gpsDeviceIdentifier") || undefined,
      },
    };

    const res = await fetch("/api/vendors/transport", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error?.formErrors?.[0] ??
          JSON.stringify(data.error?.fieldErrors ?? data.error) ??
          "Something went wrong"
      );
      return;
    }

    router.push("/vendor/transport");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Register as a transport operator</h1>
      <p className="mb-6 text-sm text-stone-600">
        Register your business and your first vehicle. If the vehicle
        already has a GPS unit installed, add its device identifier (IMEI or
        Traccar unique ID) so trip mileage can be verified from GPS instead
        of driver-reported distance.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Business name">
          <input name="businessName" required className="input" />
        </Field>
        <Field label="Business license URL (optional)">
          <input name="businessLicenseUrl" type="url" className="input" />
        </Field>

        <hr className="border-stone-200" />
        <h2 className="text-sm font-semibold text-stone-700">First vehicle</h2>

        <Field label="Vehicle type">
          <select name="type" required className="input">
            <option value="SEDAN">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="VAN">Van</option>
            <option value="BUS">Bus</option>
          </select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Passenger capacity">
            <input name="capacity" type="number" min={1} required className="input" />
          </Field>
          <Field label="Plate number">
            <input name="plateNumber" required className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Driver name">
            <input name="driverName" required className="input" />
          </Field>
          <Field label="Driver license number">
            <input name="driverLicenseNumber" required className="input" />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Rate per day (BTN)">
            <input
              name="ratePerDay"
              type="number"
              min={1}
              step="0.01"
              required
              className="input"
            />
          </Field>
          <Field label="Rate per km (optional, BTN)">
            <input name="ratePerKm" type="number" min={0} step="0.01" className="input" />
          </Field>
        </div>

        <Field label="GPS device identifier (optional)">
          <input
            name="gpsDeviceIdentifier"
            placeholder="IMEI / Traccar unique ID"
            className="input"
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
          {isSubmitting ? "Submitting..." : "Submit for review"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
