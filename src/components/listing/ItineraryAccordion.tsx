"use client";

import { useRef, useState } from "react";
import Link from "next/link";

export type ItineraryDayView = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  destination: { name: string; slug: string } | null;
  activities: string[];
  mealsIncluded: string[];
};

/**
 * Day-by-day itinerary as an accordion.
 *
 * Built on native <details>/<summary> rather than state-driven divs: the day
 * text stays in the DOM for search engines and for the browser's own
 * find-in-page, the rows open before this component hydrates, and keyboard
 * and screen-reader behaviour comes for free. The only thing React does here
 * is drive "Expand all", by writing `open` on the elements directly.
 *
 * Day one starts open so the page doesn't read as a wall of closed rows.
 */
export default function ItineraryAccordion({ days }: { days: ItineraryDayView[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [allOpen, setAllOpen] = useState(false);

  function toggleAll() {
    const next = !allOpen;
    root.current?.querySelectorAll("details").forEach((d) => {
      d.open = next;
    });
    setAllOpen(next);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={toggleAll}
          className="text-sm font-semibold text-brand-700 hover:underline"
        >
          {allOpen ? "Collapse all days" : "Expand all days"}
        </button>
      </div>

      <div ref={root} className="overflow-hidden rounded-xl border border-stone-200 bg-white">
        {days.map((day, i) => (
          <details
            key={day.id}
            open={i === 0}
            className="group border-b border-stone-200 last:border-b-0"
          >
            <summary className="flex cursor-pointer list-none items-center gap-4 px-4 py-4 transition-colors hover:bg-stone-50 sm:px-6 [&::-webkit-details-marker]:hidden">
              <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full bg-brand-50 text-brand-800">
                <span className="text-[9px] font-bold uppercase leading-none tracking-wider">
                  Day
                </span>
                <span className="font-display text-base font-bold leading-tight">
                  {day.dayNumber}
                </span>
              </span>

              <span className="min-w-0 flex-1">
                <span className="block font-display text-base font-semibold text-stone-900">
                  {day.title}
                </span>
                {day.destination && (
                  <span className="mt-0.5 block text-sm text-stone-500">
                    {day.destination.name}
                  </span>
                )}
              </span>

              <svg
                aria-hidden
                viewBox="0 0 20 20"
                className="h-5 w-5 shrink-0 text-stone-400 transition-transform group-open:rotate-180"
              >
                <path
                  d="M5 7.5 10 12.5 15 7.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </summary>

            <div className="border-t border-stone-100 bg-stone-50/60 px-4 py-4 sm:px-6 sm:pl-[5.75rem]">
              {day.description && <p className="text-stone-700">{day.description}</p>}

              {day.activities.length > 0 && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    What you&apos;ll do
                  </p>
                  <ul className="flex flex-wrap gap-2">
                    {day.activities.map((a) => (
                      <li
                        key={a}
                        className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-700"
                      >
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <p className="text-stone-600">
                  <span className="font-semibold text-stone-800">Meals: </span>
                  {day.mealsIncluded.length > 0 ? day.mealsIncluded.join(", ") : "None included"}
                </p>
                {day.destination && (
                  <Link
                    href={`/destinations/${day.destination.slug}`}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    About {day.destination.name} →
                  </Link>
                )}
              </div>
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
