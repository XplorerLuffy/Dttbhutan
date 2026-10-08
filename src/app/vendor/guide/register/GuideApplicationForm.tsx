"use client";

import { useState } from "react";
import Link from "next/link";
import PhotoUpload from "@/components/PhotoUpload";

function splitList(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * A tour guide's application. No password and no account: the details go to
 * the agency for review, and a login is only made — and emailed — if the
 * application is approved.
 */
export default function GuideApplicationForm({
  destinations,
}: {
  destinations: { id: string; name: string }[];
}) {
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sentTo, setSentTo] = useState<string | null>(null);

  const allSelected = destinations.length > 0 && destinations.every((d) => selected.has(d.id));

  function toggle(id: string) {
    setSelected((prev) => {
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
    const email = String(form.get("email") ?? "").trim();
    const res = await fetch("/api/vendors/guide/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email,
        phone: form.get("phone"),
        licenseNumber: form.get("licenseNumber"),
        languages: splitList(form.get("languages")),
        specialties: splitList(form.get("specialties")),
        yearsExperience: form.get("yearsExperience"),
        ratePerDay: form.get("ratePerDay"),
        bio: form.get("bio") || undefined,
        photoUrl: photoUrl || undefined,
        destinationIds: Array.from(selected),
        website: form.get("website"),
      }),
    }).catch(() => null);

    setIsSubmitting(false);

    if (!res) {
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Something went wrong. Please try again.");
      return;
    }
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-6">
        <p className="text-lg font-semibold text-emerald-900">Application received</p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
          Thank you. Our team will review your details and your TCB licence number, and email{" "}
          <strong>{sentTo}</strong> with a decision.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-emerald-900/90">
          You don&apos;t need to create an account. If you&apos;re approved, we&apos;ll email you a
          link to set your password and log in to your guide dashboard.
        </p>
        <Link href="/" className="btn-secondary mt-5 inline-block">
          Back to the home page
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <fieldset className="space-y-4 rounded-lg border border-stone-200 p-4">
        <legend className="px-1 text-sm font-semibold text-stone-900">About you</legend>
        <Field label="Full name">
          <input name="name" required autoComplete="name" className="input" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Email" help="We'll send our decision here.">
            <input name="email" type="email" required autoComplete="email" className="input" />
          </Field>
          <Field label="Phone / WhatsApp">
            <input name="phone" type="tel" required autoComplete="tel" className="input" />
          </Field>
        </div>
      </fieldset>

      <fieldset className="space-y-4 rounded-lg border border-stone-200 p-4">
        <legend className="px-1 text-sm font-semibold text-stone-900">Your guiding</legend>

        <Field label="TCB licence number" help="Checked by our team before anything is published.">
          <input name="licenseNumber" required className="input" />
        </Field>

        <Field label="Languages spoken (comma-separated)">
          <input name="languages" required placeholder="English, Dzongkha, Hindi" className="input" />
        </Field>

        <Field label="Specialties (comma-separated)">
          <input name="specialties" required placeholder="Trekking, Cultural, Historical" className="input" />
        </Field>

        <div>
          <div className="mb-1 flex items-baseline justify-between gap-3">
            <label className="block text-sm font-medium">Destinations you cover</label>
            {destinations.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected(allSelected ? new Set() : new Set(destinations.map((d) => d.id)))}
                aria-pressed={allSelected}
                className="text-sm font-medium text-brand-700 hover:underline"
              >
                {allSelected ? "Clear all" : "Select all"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {destinations.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggle(d.id)}
                aria-pressed={selected.has(d.id)}
                className={
                  selected.has(d.id)
                    ? "rounded-full bg-brand-700 px-3 py-1 text-sm text-white"
                    : "rounded-full border border-stone-300 px-3 py-1 text-sm text-stone-600 hover:border-brand-400"
                }
              >
                {d.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Years of experience">
            <input name="yearsExperience" type="number" min={0} max={60} required className="input" />
          </Field>
          <Field label="Rate per day (BTN)">
            <input name="ratePerDay" type="number" min={1} step="0.01" required className="input" />
          </Field>
        </div>

        <PhotoUpload label="Profile photo (optional)" onUploaded={setPhotoUrl} folder="applications" />

        <Field label="About you (optional)" help="Shown on your profile if you're approved.">
          <textarea name="bio" rows={4} className="input" />
        </Field>
      </fieldset>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Sending..." : "Submit application"}
      </button>
      <p className="text-center text-xs text-stone-500">
        No account is created until you&apos;re approved.
      </p>
    </form>
  );
}

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {help && <p className="mt-1 text-xs text-stone-500">{help}</p>}
    </div>
  );
}
