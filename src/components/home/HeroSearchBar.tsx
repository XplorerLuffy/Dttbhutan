"use client";

import { forwardRef, useRef, useState } from "react";

type Destination = { id: string; name: string; slug: string };

/**
 * The search control over the hero video.
 *
 * One form, two presentations. On a phone the four fields stacked into a
 * card pushed the headline off the screen and buried the video, so there
 * it starts as a single pill that expands on tap. From `sm` up the fields
 * are always laid out in a row and the pill never renders.
 *
 * Still a plain GET form pointing at /packages — no search backend, and it
 * works with JavaScript off, in which case the fields are simply always
 * visible (the collapsed pill is hidden without JS, since only JS can
 * expand it). Every segment maps to a filter /packages actually reads, so
 * nothing here is a control that silently does nothing when submitted.
 */

const DURATIONS = [
  { value: "1-3", label: "1–3 days" },
  { value: "4-6", label: "4–6 days" },
  { value: "7-10", label: "7–10 days" },
  { value: "11+", label: "11+ days" },
];

const CATEGORIES = [
  { value: "CULTURAL", label: "Culture & Heritage" },
  { value: "TREKKING", label: "Trekking & Adventure" },
  { value: "WILDLIFE", label: "Wildlife & Nature" },
  { value: "HONEYMOON", label: "Honeymoon & Retreats" },
];

const FIELD_LABELS = ["Destination", "Duration", "Travel Style"];

export default function HeroSearchBar({
  destinations,
  submitLabel,
  prompt,
}: {
  destinations: Destination[];
  submitLabel: string;
  prompt: string;
}) {
  const [open, setOpen] = useState(false);
  const firstFieldRef = useRef<HTMLSelectElement>(null);

  return (
    <form
      method="get"
      action="/packages"
      // A disabled control isn't serialized, so dropping the untouched ones
      // here keeps the URL to the filters actually chosen instead of
      // "?destination=&duration=&category=&difficulty=". Progressive
      // enhancement only — without JS the form still submits and works, just
      // with a longer URL.
      onSubmit={(e) => {
        e.currentTarget.querySelectorAll<HTMLSelectElement>("select").forEach((s) => {
          if (!s.value) s.disabled = true;
        });
      }}
      className="mx-auto w-full max-w-3xl rounded-3xl bg-white p-1.5 text-left shadow-xl sm:rounded-full sm:p-1"
    >
      {/* Collapsed state, phones only. `sm:hidden` rather than unmounting so
          the expanded fields below stay in the DOM and keep their values. */}
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            // Focus the first field so the tap leads somewhere instead of
            // just changing the shape of the control.
            requestAnimationFrame(() => firstFieldRef.current?.focus());
          }}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left sm:hidden"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 shrink-0 text-brand-700">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          <span className="min-w-0">
            <span className="block font-display text-base font-semibold text-stone-900">{prompt}</span>
            <span className="block truncate text-sm text-stone-500">{FIELD_LABELS.join(" · ")}</span>
          </span>
        </button>
      )}

      <div
        className={`${open ? "flex" : "hidden"} flex-col gap-1 sm:flex sm:flex-row sm:items-stretch sm:gap-0`}
      >
        <Field
          ref={firstFieldRef}
          label="Destination"
          name="destination"
          placeholder="Where would you like to go?"
          icon="pin"
        >
          {destinations.map((d) => (
            <option key={d.id} value={d.slug}>
              {d.name}
            </option>
          ))}
        </Field>

        <Divider />

        <Field label="Duration" name="duration" placeholder="Choose trip length" icon="calendar">
          {DURATIONS.map((d) => (
            <option key={d.value} value={d.value}>
              {d.label}
            </option>
          ))}
        </Field>

        <Divider />

        <Field label="Travel Style" name="category" placeholder="Find your kind of journey" icon="mountain">
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Field>

        <button
          type="submit"
          className="mt-1 flex shrink-0 items-center justify-center gap-2 rounded-full bg-brand-900 px-6 py-3 font-display text-sm font-semibold text-white transition-colors hover:bg-brand-800 sm:mt-0 sm:self-center sm:py-2.5"
        >
          {submitLabel}
          <span aria-hidden>›</span>
        </button>
      </div>
    </form>
  );
}

function Divider() {
  return <span aria-hidden className="hidden w-px shrink-0 self-center bg-stone-200 sm:block sm:h-8" />;
}

const Field = forwardRef<
  HTMLSelectElement,
  { label: string; name: string; placeholder: string; icon: "pin" | "calendar" | "mountain"; children: React.ReactNode }
>(function Field({ label, name, placeholder, icon, children }, ref) {
  return (
    <label className="group relative flex min-w-0 flex-1 cursor-pointer items-center gap-2.5 rounded-2xl px-4 py-1.5 transition-colors hover:bg-stone-50 sm:rounded-full">
      <FieldIcon name={icon} />
      <span className="min-w-0 flex-1">
      <span className="block text-xs font-semibold text-stone-900">{label}</span>
      {/* The select is transparent and sits over its own chevron so the whole
          segment stays one click target, the way a native combobox would. */}
      <select
        ref={ref}
        name={name}
        defaultValue=""
        aria-label={label}
        className="w-full cursor-pointer appearance-none truncate bg-transparent pr-5 text-xs text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      </span>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-500"
      >
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
});

function FieldIcon({ name }: { name: "pin" | "calendar" | "mountain" }) {
  const common = { viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true, className: "h-4 w-4 shrink-0 text-gold-600" } as const;
  if (name === "pin")
    return (
      <svg {...common}>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    );
  if (name === "calendar")
    return (
      <svg {...common}>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </svg>
    );
  return (
    <svg {...common}>
      <path d="m3 19 6-11 4 7 2-3 6 7H3Z" />
    </svg>
  );
}
