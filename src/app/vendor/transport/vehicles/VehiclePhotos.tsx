"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageListUpload, { type ImageItem } from "@/components/admin/ImageListUpload";

/** Lets an operator add, remove and reorder the photos of one of their vehicles. */
export default function VehiclePhotos({
  endpoint,
  initial,
  title = "Vehicle photos",
  hint = "The first photo is shown on the transport list. Clear, well-lit photos of the outside and inside work best.",
}: {
  /** The PATCH endpoint that saves this set of photos. */
  endpoint: string;
  initial: string[];
  title?: string;
  hint?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [photos, setPhotos] = useState<ImageItem[]>(() => initial.map((url) => ({ url })));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setBusy(true);
    setError(null);
    const res = await fetch(endpoint, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ photoUrls: photos.map((p) => p.url) }),
    }).catch(() => null);
    setBusy(false);
    if (!res || !res.ok) {
      const data = res ? await res.json().catch(() => ({})) : {};
      return setError(typeof data.error === "string" ? data.error : "Couldn't save the photos.");
    }
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-xs font-medium text-brand-700 hover:underline">
        {initial.length ? `Photos (${initial.length})` : "Add photos"}
      </button>
    );
  }

  return (
    <div className="mt-3 w-full space-y-3 rounded-xl border border-stone-200 bg-stone-50 p-3">
      <ImageListUpload
        images={photos}
        onChange={setPhotos}
        folder="vehicles"
        max={10}
        label={title}
        hint={hint}
        leadLabel="Main"
      />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="button" onClick={save} disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Saving…" : "Save photos"}
        </button>
        <button type="button" onClick={() => setOpen(false)} disabled={busy} className="btn-secondary">
          Cancel
        </button>
      </div>
    </div>
  );
}
