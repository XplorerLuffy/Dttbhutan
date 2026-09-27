type Destination = { id: string; name: string; slug: string };

/**
 * The single search control that sits over the hero video.
 *
 * A plain GET form pointing at /packages — no client state, no search
 * backend, and it still works with JavaScript disabled. Every segment maps
 * to a filter /packages actually reads (destination, duration, category,
 * difficulty), so nothing here is a decorative control that silently does
 * nothing when submitted.
 */

const DURATIONS = [
  { value: "1-3", label: "1–3 days" },
  { value: "4-6", label: "4–6 days" },
  { value: "7-10", label: "7–10 days" },
  { value: "11+", label: "11+ days" },
];

const CATEGORIES = [
  { value: "CULTURAL", label: "Cultural" },
  { value: "TREKKING", label: "Trekking" },
  { value: "WILDLIFE", label: "Wildlife" },
  { value: "HONEYMOON", label: "Honeymoon" },
];

const DIFFICULTIES = [
  { value: "EASY", label: "Easy" },
  { value: "MODERATE", label: "Moderate" },
  { value: "CHALLENGING", label: "Challenging" },
];

export default function HeroSearchBar({ destinations, submitLabel }: { destinations: Destination[]; submitLabel: string }) {
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
        e.currentTarget
          .querySelectorAll<HTMLSelectElement>("select")
          .forEach((s) => {
            if (!s.value) s.disabled = true;
          });
      }}
      className="mx-auto flex w-full max-w-5xl flex-col gap-1 rounded-3xl bg-white p-2 shadow-2xl sm:flex-row sm:items-stretch sm:gap-0 sm:rounded-full sm:p-1.5"
    >
      <Field label="Where" name="destination" placeholder="Search destinations">
        {destinations.map((d) => (
          <option key={d.id} value={d.slug}>
            {d.name}
          </option>
        ))}
      </Field>

      <Divider />

      <Field label="How long" name="duration" placeholder="Add trip length">
        {DURATIONS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </Field>

      <Divider />

      <Field label="What" name="category" placeholder="Choose your style">
        {CATEGORIES.map((c) => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </Field>

      <Divider />

      <Field label="Pace" name="difficulty" placeholder="How hard?">
        {DIFFICULTIES.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </Field>

      <button
        type="submit"
        className="mt-1 shrink-0 rounded-full bg-brand-700 px-8 py-4 font-display text-base font-semibold text-white transition-colors hover:bg-brand-800 sm:mt-0 sm:self-center sm:py-3.5"
      >
        {submitLabel}
      </button>
    </form>
  );
}

function Divider() {
  return <span aria-hidden className="hidden w-px shrink-0 self-center bg-stone-200 sm:block sm:h-10" />;
}

function Field({
  label,
  name,
  placeholder,
  children,
}: {
  label: string;
  name: string;
  placeholder: string;
  children: React.ReactNode;
}) {
  return (
    <label className="group relative min-w-0 flex-1 cursor-pointer rounded-2xl px-5 py-2.5 transition-colors hover:bg-stone-50 sm:rounded-full">
      <span className="block font-display text-base font-semibold text-stone-900">{label}</span>
      {/* The select is transparent and sits over its own chevron so the whole
          segment stays one click target, the way a native combobox would. */}
      <select
        name={name}
        defaultValue=""
        aria-label={label}
        className="w-full cursor-pointer appearance-none truncate bg-transparent pr-6 text-sm text-stone-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600"
      >
        <option value="">{placeholder}</option>
        {children}
      </select>
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3.5 right-4 h-4 w-4 text-stone-400"
      >
        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
