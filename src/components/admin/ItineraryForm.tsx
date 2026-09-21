"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Day = {
  dayNumber: number;
  title: string;
  description: string;
  destinationId: string;
  activities: string; // comma-separated in the UI
  mealsIncluded: string; // comma-separated in the UI
};

type InitialValues = {
  id?: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  durationDays: number;
  pricePerPerson: number;
  maxGroupSize: number | "";
  difficulty: "EASY" | "MODERATE" | "CHALLENGING";
  category: "TREKKING" | "CULTURAL" | "WILDLIFE" | "HONEYMOON";
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  includes: string; // comma-separated
  excludes: string; // comma-separated
  days: Day[];
};

const EMPTY_DAY: Day = {
  dayNumber: 1,
  title: "",
  description: "",
  destinationId: "",
  activities: "",
  mealsIncluded: "",
};

function splitList(value: string) {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function ItineraryForm({
  destinations,
  initial,
}: {
  destinations: { id: string; name: string }[];
  initial?: InitialValues;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [durationDays, setDurationDays] = useState(initial?.durationDays ?? 5);
  const [pricePerPerson, setPricePerPerson] = useState(initial?.pricePerPerson ?? 0);
  const [maxGroupSize, setMaxGroupSize] = useState<number | "">(initial?.maxGroupSize ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "EASY");
  const [category, setCategory] = useState(initial?.category ?? "CULTURAL");
  const [status, setStatus] = useState(initial?.status ?? "DRAFT");
  const [includes, setIncludes] = useState(initial?.includes ?? "");
  const [excludes, setExcludes] = useState(initial?.excludes ?? "");
  const [days, setDays] = useState<Day[]>(initial?.days?.length ? initial.days : [{ ...EMPTY_DAY }]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateDay(index: number, patch: Partial<Day>) {
    setDays((prev) => prev.map((d, i) => (i === index ? { ...d, ...patch } : d)));
  }

  function addDay() {
    setDays((prev) => [...prev, { ...EMPTY_DAY, dayNumber: prev.length + 1 }]);
  }

  function removeDay(index: number) {
    setDays((prev) => prev.filter((_, i) => i !== index).map((d, i) => ({ ...d, dayNumber: i + 1 })));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload = {
      title,
      slug,
      summary,
      description: description || undefined,
      durationDays,
      pricePerPerson,
      maxGroupSize: maxGroupSize === "" ? undefined : maxGroupSize,
      difficulty,
      category,
      status,
      includes: splitList(includes),
      excludes: splitList(excludes),
      days: days.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        description: d.description || undefined,
        destinationId: d.destinationId || undefined,
        activities: splitList(d.activities),
        mealsIncluded: splitList(d.mealsIncluded),
      })),
    };

    const res = await fetch(isEdit ? `/api/admin/itineraries/${initial!.id}` : "/api/admin/itineraries", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error?.formErrors?.[0] ?? data.error ?? "Something went wrong");
      return;
    }

    router.push("/admin/packages");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="card space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Title">
            <input value={title} onChange={(e) => setTitle(e.target.value)} required className="input" />
          </Field>
          <Field label="Slug (URL, lowercase-with-hyphens)">
            <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="input" />
          </Field>
        </div>

        <Field label="Summary (shown on listing cards)">
          <input value={summary} onChange={(e) => setSummary(e.target.value)} required maxLength={500} className="input" />
        </Field>

        <Field label="Full description (optional)">
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="input" />
        </Field>

        <div className="grid gap-3 sm:grid-cols-4">
          <Field label="Duration (days)">
            <input
              type="number"
              min={1}
              value={durationDays}
              onChange={(e) => setDurationDays(Number(e.target.value))}
              required
              className="input"
            />
          </Field>
          <Field label="Price/person (BTN)">
            <input
              type="number"
              min={1}
              step="0.01"
              value={pricePerPerson}
              onChange={(e) => setPricePerPerson(Number(e.target.value))}
              required
              className="input"
            />
          </Field>
          <Field label="Max group size (optional)">
            <input
              type="number"
              min={1}
              value={maxGroupSize}
              onChange={(e) => setMaxGroupSize(e.target.value === "" ? "" : Number(e.target.value))}
              className="input"
            />
          </Field>
          <Field label="Difficulty">
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as typeof difficulty)} className="input">
              <option value="EASY">Easy</option>
              <option value="MODERATE">Moderate</option>
              <option value="CHALLENGING">Challenging</option>
            </select>
          </Field>
        </div>

        <Field label="Category">
          <select value={category} onChange={(e) => setCategory(e.target.value as typeof category)} className="input">
            <option value="TREKKING">Trekking</option>
            <option value="CULTURAL">Cultural</option>
            <option value="WILDLIFE">Wildlife</option>
            <option value="HONEYMOON">Honeymoon</option>
          </select>
        </Field>

        <Field label="Status">
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
            <option value="DRAFT">Draft (hidden from travelers)</option>
            <option value="PUBLISHED">Published</option>
            <option value="ARCHIVED">Archived</option>
          </select>
        </Field>

        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Includes (comma-separated)">
            <input value={includes} onChange={(e) => setIncludes(e.target.value)} className="input" />
          </Field>
          <Field label="Excludes (comma-separated)">
            <input value={excludes} onChange={(e) => setExcludes(e.target.value)} className="input" />
          </Field>
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Day-by-day itinerary</h2>
          <button type="button" onClick={addDay} className="btn-secondary">
            + Add day
          </button>
        </div>

        <div className="space-y-3">
          {days.map((day, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Day {day.dayNumber}</span>
                {days.length > 1 && (
                  <button type="button" onClick={() => removeDay(i)} className="text-sm text-red-600 hover:underline">
                    Remove
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Title">
                  <input
                    value={day.title}
                    onChange={(e) => updateDay(i, { title: e.target.value })}
                    required
                    className="input"
                  />
                </Field>
                <Field label="Destination (optional)">
                  <select
                    value={day.destinationId}
                    onChange={(e) => updateDay(i, { destinationId: e.target.value })}
                    className="input"
                  >
                    <option value="">No specific destination</option>
                    {destinations.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>

              <Field label="Description (optional)">
                <textarea
                  value={day.description}
                  onChange={(e) => updateDay(i, { description: e.target.value })}
                  rows={2}
                  className="input"
                />
              </Field>

              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Activities (comma-separated)">
                  <input
                    value={day.activities}
                    onChange={(e) => updateDay(i, { activities: e.target.value })}
                    className="input"
                  />
                </Field>
                <Field label="Meals included (comma-separated)">
                  <input
                    value={day.mealsIncluded}
                    onChange={(e) => updateDay(i, { mealsIncluded: e.target.value })}
                    placeholder="Breakfast, Lunch, Dinner"
                    className="input"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={isSubmitting} className="btn-primary w-full">
        {isSubmitting ? "Saving..." : isEdit ? "Save changes" : "Create package"}
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
