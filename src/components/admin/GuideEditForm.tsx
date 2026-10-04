"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Field,
  readError,
  splitList,
  nullableText,
} from "@/components/admin/vendorFormFields";
import PhotoUpload from "@/components/PhotoUpload";
import VendorContactFields, { useVendorContact } from "@/components/admin/VendorContactFields";

export const EMPTY_GUIDE = {
  licenseNumber: "",
  languages: [] as string[],
  specialties: [] as string[],
  yearsExperience: 0,
  ratePerDay: "",
  bio: "",
  photoUrl: "",
  destinationIds: [] as string[],
};

/**
 * Edits a guide listing — or, with no `guideId`, adds a new one, which also
 * asks who the guide is (the profile needs an account to belong to).
 */
export default function GuideEditForm({
  guideId,
  destinations,
  initial,
}: {
  guideId?: string;
  destinations: { id: string; name: string }[];
  initial: {
    licenseNumber: string;
    languages: string[];
    specialties: string[];
    yearsExperience: number;
    ratePerDay: string;
    bio: string;
    photoUrl: string;
    destinationIds: string[];
  };
}) {
  const router = useRouter();
  const creating = !guideId;
  const contact = useVendorContact();

  const [licenseNumber, setLicenseNumber] = useState(initial.licenseNumber);
  const [languages, setLanguages] = useState(initial.languages.join(", "));
  const [specialties, setSpecialties] = useState(initial.specialties.join(", "));
  const [yearsExperience, setYearsExperience] = useState(String(initial.yearsExperience));
  const [ratePerDay, setRatePerDay] = useState(initial.ratePerDay);
  const [bio, setBio] = useState(initial.bio);
  const [photoUrl, setPhotoUrl] = useState(initial.photoUrl);
  const [coverage, setCoverage] = useState<string[]>(initial.destinationIds);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allCovered = destinations.length > 0 && destinations.every((d) => coverage.includes(d.id));

  function toggleCoverage(id: string) {
    setCoverage((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const details = {
      licenseNumber,
      languages: splitList(languages),
      specialties: splitList(specialties),
      yearsExperience,
      ratePerDay,
      bio: nullableText(bio),
      photoUrl: nullableText(photoUrl),
      destinationIds: coverage,
    };
    const res = await fetch(creating ? "/api/admin/guides" : `/api/admin/guides/${guideId}`, {
      method: creating ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(creating ? { contact: contact.value, guide: details } : details),
    });

    setIsSubmitting(false);
    if (!res.ok) {
      setError(readError(await res.json().catch(() => ({}))));
      return;
    }
    router.push("/admin/vendors");
    router.refresh();
  }

  const trimmedPhoto = photoUrl.trim();

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      {creating && <VendorContactFields kind="guide" contact={contact} />}

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="TCB licence number">
          <input
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.target.value)}
            required
            className="input"
          />
        </Field>
        <Field label="Years of experience">
          <input
            value={yearsExperience}
            onChange={(e) => setYearsExperience(e.target.value)}
            inputMode="numeric"
            required
            className="input"
          />
        </Field>
      </div>

      <Field label="Rate per day (BTN)">
        <input
          value={ratePerDay}
          onChange={(e) => setRatePerDay(e.target.value)}
          inputMode="decimal"
          required
          className="input"
        />
      </Field>

      <Field label="Languages" help="Comma-separated, e.g. English, Dzongkha, Hindi">
        <input value={languages} onChange={(e) => setLanguages(e.target.value)} required className="input" />
      </Field>

      <Field label="Specialties" help="Comma-separated, e.g. trekking, cultural, birdwatching">
        <input
          value={specialties}
          onChange={(e) => setSpecialties(e.target.value)}
          required
          className="input"
        />
      </Field>

      <Field label="Bio" help="Shown on the guide's card and on the homepage spotlight.">
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={5} className="input" />
      </Field>

      <PhotoUpload
        label="Guide photo"
        initialUrl={trimmedPhoto || null}
        onUploaded={(url) => setPhotoUrl(url)}
      />

      <Field label="…or paste a photo URL">
        <input value={photoUrl} onChange={(e) => setPhotoUrl(e.target.value)} className="input" />
      </Field>

      <Field label="Dzongkhags covered">
        <button
          type="button"
          onClick={() => setCoverage(allCovered ? [] : destinations.map((d) => d.id))}
          className="mb-2 text-sm font-medium text-brand-700 hover:underline"
        >
          {allCovered ? "Clear all" : "Select all"}
        </button>
        <div className="max-h-56 overflow-y-auto rounded-lg border border-stone-200 p-3">
          <div className="grid gap-2 sm:grid-cols-3">
            {destinations.map((d) => (
              <label key={d.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={coverage.includes(d.id)}
                  onChange={() => toggleCoverage(d.id)}
                />
                {d.name}
              </label>
            ))}
          </div>
        </div>
      </Field>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Saving..." : creating ? "Add guide" : "Save changes"}
      </button>
    </form>
  );
}
