"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function HotelRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      hotel: {
        name: form.get("name"),
        description: form.get("description") || undefined,
        location: form.get("location"),
        address: form.get("address") || undefined,
        amenities: splitList(form.get("amenities")),
        businessLicenseUrl: form.get("businessLicenseUrl") || undefined,
      },
      roomType: {
        name: form.get("roomName"),
        capacity: form.get("roomCapacity"),
        pricePerNight: form.get("pricePerNight"),
        totalRooms: form.get("totalRooms"),
      },
    };

    const res = await fetch("/api/vendors/hotel", {
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

    router.push("/vendor/hotel");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Register your hotel</h1>
      <p className="mb-6 text-sm text-stone-600">
        Add your first room type now — you can add more room types and
        photos from your dashboard after approval. An admin reviews your
        listing before it appears in search.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Hotel / property name">
          <input name="name" required className="input" />
        </Field>

        <Field label="Location (town/district)">
          <input name="location" required placeholder="Paro" className="input" />
        </Field>

        <Field label="Address (optional)">
          <input name="address" className="input" />
        </Field>

        <Field label="Amenities (comma-separated)">
          <input
            name="amenities"
            placeholder="WiFi, Breakfast included, Mountain view"
            className="input"
          />
        </Field>

        <Field label="Description (optional)">
          <textarea name="description" rows={3} className="input" />
        </Field>

        <Field label="Business license URL (optional)">
          <input name="businessLicenseUrl" type="url" className="input" />
        </Field>

        <hr className="border-stone-200" />
        <h2 className="text-sm font-semibold text-stone-700">First room type</h2>

        <Field label="Room type name">
          <input name="roomName" required placeholder="Deluxe Double" className="input" />
        </Field>

        <div className="grid grid-cols-3 gap-3">
          <Field label="Capacity">
            <input name="roomCapacity" type="number" min={1} required className="input" />
          </Field>
          <Field label="Price/night (BTN)">
            <input
              name="pricePerNight"
              type="number"
              min={1}
              step="0.01"
              required
              className="input"
            />
          </Field>
          <Field label="Rooms available">
            <input name="totalRooms" type="number" min={1} required className="input" />
          </Field>
        </div>

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
