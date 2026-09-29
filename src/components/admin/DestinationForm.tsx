"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DzongkhagRegion } from "@prisma/client";
import { REGION_LABEL, REGION_ORDER } from "@/lib/regions";

type InitialValues = {
  id: string;
  name: string;
  slug: string;
  region: DzongkhagRegion;
  description: string;
  highlights: string[];
  photoUrl: string;
  latitude: string;
  longitude: string;
};

/** One highlight per line rather than comma-separated (the convention in
 * ItineraryForm): highlights are place names, and several of the seeded ones
 * read naturally with a comma in them ("Trongsa, the ancestral seat"), which a
 * comma split would quietly tear in half. */
function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

/** Blank means "not recorded" and must clear the column, so null rather than
 * undefined — the route spreads parsed data into prisma.update. */
function nullableText(value: string): string | null {
  return value.trim() || null;
}

function nullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function DestinationForm({ initial }: { initial: InitialValues }) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [region, setRegion] = useState<DzongkhagRegion>(initial.region);
  const [description, setDescription] = useState(initial.description);
  const [highlights, setHighlights] = useState(initial.highlights.join("\n"));
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [latitude, setLatitude] = useState(initial.latitude);
  const [longitude, setLongitude] = useState(initial.longitude);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const res = await fetch(`/api/admin/destinations/${initial.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        region,
        description: nullableText(description),
        highlights: splitLines(highlights),
        photoUrl: nullableText(photoUrl),
        latitude: nullableNumber(latitude),
        longitude: nullableNumber(longitude),
      }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(
        data.error?.formErrors?.[0] ??
          (typeof data.error === "string" ? data.error : null) ??
          "Something went wrong"
      );
      return;
    }

    router.push("/admin/destinations");
    router.refresh();
  }

  const trimmedPhoto = photoUrl.trim();

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Name">
          <input value={name} onChange={(e) => setName(e.target.value)} required className="input" />
        </Field>
        <Field label="Region">
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value as DzongkhagRegion)}
            className="input"
          >
            {REGION_ORDER.map((r) => (
              <option key={r} value={r}>
                {REGION_LABEL[r]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="URL">
        <input value={`/destinations/${initial.slug}`} readOnly disabled className="input bg-stone-100" />
        <p className="mt-1 text-xs text-stone-500">
          Fixed — the address is already in search results and travelers&apos; bookmarks, so changing
          it would break those links.
        </p>
      </Field>

      <Field label="Description (shown under the heading on the destination page)">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          className="input"
        />
      </Field>

      <Field label="Highlights — one per line (shown as chips on the destination page)">
        <textarea
          value={highlights}
          onChange={(e) => setHighlights(e.target.value)}
          rows={5}
          className="input"
          placeholder={"Paro Taktsang (Tiger's Nest)\nRinpung Dzong"}
        />
      </Field>

      <Field label="Photo URL (used on the homepage destination grid and the listing card)">
        <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="input" />
      </Field>

      {trimmedPhoto && (
        <div className="overflow-hidden rounded-lg border border-stone-200">
          {/* Arbitrary admin-entered URL, including remote hosts not in the
              next.config image allowlist — next/image would throw on those. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={trimmedPhoto} alt="" className="aspect-[16/9] w-full object-cover" />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Latitude (optional)">
          <input
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            inputMode="decimal"
            className="input"
          />
        </Field>
        <Field label="Longitude (optional)">
          <input
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
    </div>
  );
}
