"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AddRoomTypeForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/vendors/hotel/room-types", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        capacity: form.get("capacity"),
        pricePerNight: form.get("pricePerNight"),
        totalRooms: form.get("totalRooms"),
      }),
    });

    setIsSubmitting(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? "Could not add room type");
      return;
    }

    (e.target as HTMLFormElement).reset();
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary">
        + Add room type
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input name="name" placeholder="Room type name" required className="input" />
        <input name="capacity" type="number" min={1} placeholder="Capacity" required className="input" />
        <input
          name="pricePerNight"
          type="number"
          min={1}
          step="0.01"
          placeholder="Price/night (BTN)"
          required
          className="input"
        />
        <input name="totalRooms" type="number" min={1} placeholder="Rooms available" required className="input" />
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting} className="btn-primary">
          {isSubmitting ? "Adding..." : "Add"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
