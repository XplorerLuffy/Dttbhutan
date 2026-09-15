"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { DzongkhagRegion } from "@prisma/client";

type Destination = { id: string; name: string; region: DzongkhagRegion };

const REGION_LABEL: Record<DzongkhagRegion, string> = {
  WEST: "Western Bhutan",
  CENTRAL: "Central Bhutan",
  EAST: "Eastern Bhutan",
};

export default function CustomTourRequestForm({
  destinations,
  preselectedDestinationId,
}: {
  destinations: Destination[];
  preselectedDestinationId?: string;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    new Set(preselectedDestinationId ? [preselectedDestinationId] : [])
  );
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
    setNeedsLogin(false);

    if (selected.size === 0) {
      setError("Select at least one destination you'd like to visit.");
      return;
    }
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/custom-tour-requests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        startDate: form.get("startDate"),
        endDate: form.get("endDate"),
        travelers: form.get("travelers"),
        budgetPerPerson: form.get("budgetPerPerson") || undefined,
        notes: form.get("notes") || undefined,
        destinationIds: Array.from(selected),
      }),
    });

    setIsSubmitting(false);

    if (res.status === 401) {
      setNeedsLogin(true);
      return;
    }
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Could not send your request");
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="card">
        <h3 className="font-semibold text-pine-800">Request sent</h3>
        <p className="mt-2 text-sm text-stone-600">
          Our team will review your preferences and follow up with a quote.
          You can see the status of your request from your dashboard.
        </p>
        <button type="button" onClick={() => router.push("/dashboard")} className="btn-primary mt-4">
          Go to my dashboard
        </button>
      </div>
    );
  }

  const byRegion = new Map<DzongkhagRegion, Destination[]>();
  for (const d of destinations) byRegion.set(d.region, [...(byRegion.get(d.region) ?? []), d]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <h2 className="mb-3 text-sm font-semibold">Which destinations interest you?</h2>
        {(["WEST", "CENTRAL", "EAST"] as const).map((region) => {
          const items = byRegion.get(region) ?? [];
          if (items.length === 0) return null;
          return (
            <div key={region} className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wide text-stone-400">
                {REGION_LABEL[region]}
              </p>
              <div className="flex flex-wrap gap-2">
                {items.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => toggle(d.id)}
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
          );
        })}
      </div>

      <div className="card grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium">Start date</label>
          <input name="startDate" type="date" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">End date</label>
          <input name="endDate" type="date" required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Travelers</label>
          <input name="travelers" type="number" min={1} max={30} defaultValue={2} required className="input" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Budget per person (BTN, optional)</label>
          <input name="budgetPerPerson" type="number" min={1} step="0.01" className="input" />
        </div>
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium">Tell us what you&apos;re looking for</label>
          <textarea
            name="notes"
            rows={4}
            placeholder="Trekking vs. cultural sites, hotel style, pace, special occasions, dietary needs..."
            className="input"
          />
        </div>
      </div>

      {needsLogin && (
        <p className="text-sm text-amber-700">
          <Link href="/login" className="underline">
            Log in
          </Link>{" "}
          as a traveler to send a custom tour request.
        </p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Sending..." : "Send request"}
      </button>
    </form>
  );
}
