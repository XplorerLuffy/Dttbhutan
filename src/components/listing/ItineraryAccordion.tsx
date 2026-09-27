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
  lodgingName: string | null;
  hike: DayHike | null;
};

/** Present only on days with walking recorded; every field is optional. */
export type DayHike = {
  distanceKm: number | null;
  ascentM: number | null;
  descentM: number | null;
  hours: number | null;
  difficulty: "EASY" | "MODERATE" | "CHALLENGING" | null;
  note: string | null;
};

const HIKE_LEVEL: Record<NonNullable<DayHike["difficulty"]>, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
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
                <span className="mt-0.5 block text-sm text-stone-500">
                  {[day.destination?.name, hikeSummary(day.hike)].filter(Boolean).join(" · ")}
                </span>
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

              {day.hike && (
                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Hiking options
                  </p>
                  <dl className="flex flex-wrap gap-x-8 gap-y-2">
                    {day.hike.distanceKm !== null && (
                      <HikeStat label="Distance" value={`${day.hike.distanceKm} km`} />
                    )}
                    {day.hike.ascentM !== null && (
                      <HikeStat label="Ascent" value={`${day.hike.ascentM} m`} />
                    )}
                    {day.hike.descentM !== null && (
                      <HikeStat label="Descent" value={`${day.hike.descentM} m`} />
                    )}
                    {day.hike.hours !== null && (
                      <HikeStat label="On foot" value={formatHours(day.hike.hours)} />
                    )}
                    {day.hike.difficulty && (
                      <HikeStat label="Level" value={HIKE_LEVEL[day.hike.difficulty]} />
                    )}
                  </dl>
                  {day.hike.note && (
                    <p className="mt-2 text-sm text-stone-600">{day.hike.note}</p>
                  )}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <p className="text-stone-600">
                  <span className="font-semibold text-stone-800">Meals: </span>
                  {day.mealsIncluded.length > 0 ? day.mealsIncluded.join(", ") : "None included"}
                </p>
                <p className="text-stone-600">
                  <span className="font-semibold text-stone-800">Stay: </span>
                  {day.lodgingName ?? "No overnight stay"}
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

function HikeStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="font-display text-base font-semibold text-stone-900">{value}</dd>
    </div>
  );
}

/**
 * The one-line version shown on the closed row. Distance is the number
 * people scan for, so it leads; the level only earns its place when the day
 * differs from the trip's own rating, which the caller decides by leaving
 * `difficulty` null when it matches.
 */
function hikeSummary(hike: DayHike | null): string | null {
  if (!hike) return null;
  const parts: string[] = [];
  if (hike.distanceKm !== null) parts.push(`${hike.distanceKm} km walk`);
  else if (hike.hours !== null) parts.push(`${formatHours(hike.hours)} on foot`);
  if (hike.difficulty) parts.push(HIKE_LEVEL[hike.difficulty].toLowerCase());
  return parts.length > 0 ? parts.join(", ") : null;
}

function formatHours(hours: number): string {
  const whole = Math.floor(hours);
  const half = hours - whole >= 0.5;
  if (whole === 0) return "30 min";
  return `${whole}${half ? "\u00bd" : ""} hr${whole === 1 && !half ? "" : "s"}`;
}
