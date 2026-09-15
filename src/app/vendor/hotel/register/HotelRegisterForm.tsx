"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import PhotoUpload from "@/components/PhotoUpload";

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function HotelRegisterForm({
  destinations,
}: {
  destinations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      hotel: {
        name: form.get("name"),
        description: form.get("description") || undefined,
        destinationId: form.get("destinationId"),
        address: form.get("address") || undefined,
        amenities: splitList(form.get("amenities")),
        businessLicenseUrl: form.get("businessLicenseUrl") || undefined,
        photoUrls: photoUrl ? [photoUrl] : [],
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Hotel / property name">
        <input name="name" required className="input" />
      </Field>

      <Field label="Destination (dzongkhag)">
        <select name="destinationId" required defaultValue="" className="input">
          <option value="" disabled>
            Select a destination
          </option>
          {destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Address (optional)">
        <input name="address" placeholder="Norzin Lam, near the clock tower" className="input" />
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

      <PhotoUpload label="Cover photo (optional)" onUploaded={setPhotoUrl} />

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
