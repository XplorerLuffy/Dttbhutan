"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function GuideRegisterPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      photoUrl: form.get("photoUrl") || undefined,
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
    <div className="mx-auto max-w-lg">
      <h1 className="mb-1 text-2xl font-bold">Register as a tour guide</h1>
      <p className="mb-6 text-sm text-stone-600">
        Your TCB (Tourism Council of Bhutan) license number is required. An
        admin reviews every guide profile before it appears in search — this
        is a manual check today rather than an automated TCB lookup.
      </p>

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

        <Field label="Photo URL (optional)">
          <input name="photoUrl" type="url" className="input" />
        </Field>

        <Field label="Bio (optional)">
          <textarea name="bio" rows={4} className="input" />
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
