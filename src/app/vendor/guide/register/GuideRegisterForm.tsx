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

export default function GuideRegisterForm({
  destinations,
}: {
  destinations: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selectedDestinations, setSelectedDestinations] = useState<Set<string>>(new Set());

  function toggleDestination(id: string) {
    setSelectedDestinations((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const payload = {
      licenseNumber: form.get("licenseNumber"),
      languages: splitList(form.get("languages")),
      specialties: splitList(form.get("specialties")),
      yearsExperience: form.get("yearsExperience"),
      ratePerDay: form.get("ratePerDay"),
      bio: form.get("bio") || undefined,
      photoUrl: photoUrl || undefined,
      destinationIds: Array.from(selectedDestinations),
    };

    const res = await fetch("/api/vendors/guide", {
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

    router.push("/vendor/guide");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="TCB license number">
        <input name="licenseNumber" required className="input" />
      </Field>

      <Field label="Languages spoken (comma-separated)">
        <input
          name="languages"
          required
          placeholder="English, Dzongkha, Hindi"
          className="input"
        />
      </Field>

      <Field label="Specialties (comma-separated)">
        <input
          name="specialties"
          required
          placeholder="Trekking, Cultural, Historical"
          className="input"
        />
      </Field>

      <div>
        <label className="mb-1 block text-sm font-medium">Destinations you cover</label>
        <div className="flex flex-wrap gap-2">
          {destinations.map((d) => (
            <button
              key={d.id}
              type="button"
              onClick={() => toggleDestination(d.id)}
              className={
                selectedDestinations.has(d.id)
                  ? "rounded-full bg-brand-700 px-3 py-1 text-sm text-white"
                  : "rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-600 hover:border-brand-400"
              }
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      <Field label="Years of experience">
        <input
          name="yearsExperience"
          type="number"
          min={0}
          required
          className="input"
        />
      </Field>

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

      <PhotoUpload label="Profile photo (optional)" onUploaded={setPhotoUrl} />

      <Field label="Bio (optional)">
        <textarea name="bio" rows={4} className="input" />
      </Field>

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
