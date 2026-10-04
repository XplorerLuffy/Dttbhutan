"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImageListUpload from "@/components/admin/ImageListUpload";

type Day = {
  dayNumber: number;
  title: string;
  description: string;
  destinationId: string;
  activities: string; // comma-separated in the UI
  mealsIncluded: string; // comma-separated in the UI
  /** Index into `lodgings`, or "" for a day with no overnight stay. */
  lodgingIndex: number | "";
  hikeDistanceKm: number | "";
  hikeAscentM: number | "";
  hikeDescentM: number | "";
  hikeHours: number | "";
  hikeDifficulty: "" | "EASY" | "MODERATE" | "CHALLENGING";
  hikeNote: string;
};

export type Lodging = {
  name: string;
  location: string;
  description: string;
  photoUrl: string;
};

export type Photo = {
  url: string;
  caption: string;
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
  coverPhotoUrl: string;
  includes: string; // comma-separated
  excludes: string; // comma-separated
  days: Day[];
  lodgings: Lodging[];
  photos: Photo[];
};

const EMPTY_DAY: Day = {
  dayNumber: 1,
  title: "",
  description: "",
  destinationId: "",
  activities: "",
  mealsIncluded: "",
  lodgingIndex: "",
  hikeDistanceKm: "",
  hikeAscentM: "",
  hikeDescentM: "",
  hikeHours: "",
  hikeDifficulty: "",
  hikeNote: "",
};

const EMPTY_LODGING: Lodging = { name: "", location: "", description: "", photoUrl: "" };

/** Blank number inputs stay blank rather than becoming 0. */
function num(value: string): number | "" {
  return value === "" ? "" : Number(value);
}

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
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(initial?.coverPhotoUrl ?? "");
  const [includes, setIncludes] = useState(initial?.includes ?? "");
  const [excludes, setExcludes] = useState(initial?.excludes ?? "");
  const [days, setDays] = useState<Day[]>(initial?.days?.length ? initial.days : [{ ...EMPTY_DAY }]);
  const [lodgings, setLodgings] = useState<Lodging[]>(initial?.lodgings ?? []);
  const [photos, setPhotos] = useState<Photo[]>(initial?.photos ?? []);
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

  function addLodging() {
    setLodgings((prev) => [...prev, { ...EMPTY_LODGING }]);
  }

  function updateLodging(index: number, patch: Partial<Lodging>) {
    setLodgings((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  }

  /**
   * Removing a property has to fix up the days that pointed at it, since a
   * day stores its lodging as a position in this list: everything after the
   * removed entry shifts down by one, and the days that used the removed
   * one are left with no stay rather than silently pointing at its
   * neighbour.
   */
  function removeLodging(index: number) {
    setLodgings((prev) => prev.filter((_, i) => i !== index));
    setDays((prev) =>
      prev.map((d) => {
        if (d.lodgingIndex === "") return d;
        if (d.lodgingIndex === index) return { ...d, lodgingIndex: "" };
        if (d.lodgingIndex > index) return { ...d, lodgingIndex: d.lodgingIndex - 1 };
        return d;
      })
    );
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
      // null, not undefined: emptying the box has to clear the stored cover,
      // and an undefined key would be dropped by JSON.stringify.
      coverPhotoUrl: coverPhotoUrl.trim() || null,
      includes: splitList(includes),
      excludes: splitList(excludes),
      days: days.map((d) => ({
        dayNumber: d.dayNumber,
        title: d.title,
        description: d.description || undefined,
        destinationId: d.destinationId || undefined,
        activities: splitList(d.activities),
        mealsIncluded: splitList(d.mealsIncluded),
        lodgingIndex: d.lodgingIndex === "" ? undefined : d.lodgingIndex,
        hikeDistanceKm: d.hikeDistanceKm === "" ? undefined : d.hikeDistanceKm,
        hikeAscentM: d.hikeAscentM === "" ? undefined : d.hikeAscentM,
        hikeDescentM: d.hikeDescentM === "" ? undefined : d.hikeDescentM,
        hikeHours: d.hikeHours === "" ? undefined : d.hikeHours,
        hikeDifficulty: d.hikeDifficulty || undefined,
        hikeNote: d.hikeNote || undefined,
      })),
      photos: photos
        .filter((p) => p.url.trim())
        .map((p) => ({ url: p.url.trim(), caption: p.caption || undefined })),
      lodgings: lodgings
        .filter((l) => l.name.trim())
        .map((l) => ({
          name: l.name.trim(),
          location: l.location || undefined,
          description: l.description || undefined,
          photoUrl: l.photoUrl || undefined,
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

    router.push("/chim/packages");
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
        <h2 className="mb-1 text-lg font-semibold">Cover photo</h2>
        <p className="mb-3 text-sm text-stone-600">
          The single most visible image for this trip: the banner across the top of its page, and
          the photo on every card that links to it. Without one the page opens on a plain colour
          block, which is the main thing that makes a trip look unfinished.
        </p>

        {/* 16:9 is roughly what the banner crops to, so a portrait shot or a
            subject near the edge shows its problem here rather than live. */}
        <ImageListUpload
          images={coverPhotoUrl.trim() ? [{ url: coverPhotoUrl.trim() }] : []}
          onChange={(next) => setCoverPhotoUrl(next[0]?.url ?? "")}
          folder="packages"
          max={1}
          label=""
          aspect="aspect-[16/9]"
        />
      </div>

      <div>
        <h2 className="mb-1 text-lg font-semibold">Gallery</h2>
        <p className="mb-3 text-sm text-stone-600">
          Photos for the trip page&apos;s Gallery tab, in this order — the first one gets the
          large cell. The tab only appears once there is at least one. This is separate from the
          cover photo, which has to work cropped to a card; any gallery photo can be made the
          cover with &ldquo;Use as cover&rdquo;.
        </p>

        <ImageListUpload
          images={photos}
          onChange={(next) => setPhotos(next.map((p) => ({ url: p.url, caption: p.caption ?? "" })))}
          folder="packages"
          max={60}
          label="Gallery photos"
          leadLabel="Large"
          captions
          action={{ label: "Use as cover", run: setCoverPhotoUrl }}
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Where they stay</h2>
          <button type="button" onClick={addLodging} className="btn-secondary">
            + Add property
          </button>
        </div>
        <p className="mb-3 text-sm text-stone-600">
          List each hotel, guesthouse or camp once, then pick it per night below. The public page
          works out how many nights each one is from the days that use it.
        </p>

        <div className="space-y-3">
          {lodgings.map((lodging, i) => (
            <div key={i} className="card space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Property {i + 1}</span>
                <button
                  type="button"
                  onClick={() => removeLodging(i)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label="Name">
                  <input
                    value={lodging.name}
                    onChange={(e) => updateLodging(i, { name: e.target.value })}
                    placeholder="Zhiwa Ling Heritage"
                    className="input"
                  />
                </Field>
                <Field label="Location (optional)">
                  <input
                    value={lodging.location}
                    onChange={(e) => updateLodging(i, { location: e.target.value })}
                    placeholder="Paro"
                    className="input"
                  />
                </Field>
              </div>
              <Field label="Description (optional)">
                <textarea
                  value={lodging.description}
                  onChange={(e) => updateLodging(i, { description: e.target.value })}
                  rows={2}
                  className="input"
                />
              </Field>
              <ImageListUpload
                images={lodging.photoUrl ? [{ url: lodging.photoUrl }] : []}
                onChange={(next) => updateLodging(i, { photoUrl: next[0]?.url ?? "" })}
                folder="packages"
                max={1}
                label="Photo (optional)"
              />
            </div>
          ))}
          {lodgings.length === 0 && (
            <p className="text-sm text-stone-500">
              No properties yet. The trip page simply leaves out the &ldquo;Where you&rsquo;ll
              stay&rdquo; section.
            </p>
          )}
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

              <Field label="Where they stay tonight">
                <select
                  value={day.lodgingIndex}
                  onChange={(e) =>
                    updateDay(i, { lodgingIndex: e.target.value === "" ? "" : Number(e.target.value) })
                  }
                  className="input"
                >
                  <option value="">No overnight stay (departure day)</option>
                  {lodgings.map((l, li) => (
                    <option key={li} value={li}>
                      {l.name.trim() || `Property ${li + 1}`}
                      {l.location ? ` — ${l.location}` : ""}
                    </option>
                  ))}
                </select>
              </Field>

              <fieldset className="rounded-md border border-stone-200 p-3">
                <legend className="px-1 text-sm font-medium text-stone-700">
                  Hiking / walking this day (all optional)
                </legend>
                <div className="grid gap-3 sm:grid-cols-4">
                  <Field label="Distance (km)">
                    <input
                      type="number"
                      min={0}
                      step="0.1"
                      value={day.hikeDistanceKm}
                      onChange={(e) => updateDay(i, { hikeDistanceKm: num(e.target.value) })}
                      className="input"
                    />
                  </Field>
                  <Field label="Ascent (m)">
                    <input
                      type="number"
                      min={0}
                      value={day.hikeAscentM}
                      onChange={(e) => updateDay(i, { hikeAscentM: num(e.target.value) })}
                      className="input"
                    />
                  </Field>
                  <Field label="Descent (m)">
                    <input
                      type="number"
                      min={0}
                      value={day.hikeDescentM}
                      onChange={(e) => updateDay(i, { hikeDescentM: num(e.target.value) })}
                      className="input"
                    />
                  </Field>
                  <Field label="Hours on foot">
                    <input
                      type="number"
                      min={0}
                      step="0.5"
                      value={day.hikeHours}
                      onChange={(e) => updateDay(i, { hikeHours: num(e.target.value) })}
                      className="input"
                    />
                  </Field>
                </div>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <Field label="This day's level">
                    <select
                      value={day.hikeDifficulty}
                      onChange={(e) =>
                        updateDay(i, { hikeDifficulty: e.target.value as Day["hikeDifficulty"] })
                      }
                      className="input"
                    >
                      <option value="">Same as the trip</option>
                      <option value="EASY">Easy</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="CHALLENGING">Challenging</option>
                    </select>
                  </Field>
                  <Field label="Note (optional)">
                    <input
                      value={day.hikeNote}
                      onChange={(e) => updateDay(i, { hikeNote: e.target.value })}
                      placeholder="Shorter valley option available"
                      className="input"
                    />
                  </Field>
                </div>
              </fieldset>
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
