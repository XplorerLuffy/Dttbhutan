"use client";

import Image from "next/image";
import Link from "next/link";
import type { PackageCard } from "@/lib/ai/cards";
import Money from "@/components/Money";

const CATEGORY_LABEL: Record<string, string> = {
  TREKKING: "Trekking",
  CULTURAL: "Cultural",
  WILDLIFE: "Wildlife",
  HONEYMOON: "Honeymoon",
};

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

/** Enough to show the shape of the trip without turning the card into the
 * itinerary page it links to. */
const DAYS_SHOWN = 5;

/**
 * A package the assistant referred to, rendered as a card inside its reply.
 *
 * Every figure here comes from the database via collectPackageCards, never
 * from the model's prose — the model chooses which package is relevant, and
 * this shows what that package actually costs.
 */
export default function AssistantPackageCard({ card }: { card: PackageCard }) {
  const shown = card.days.slice(0, DAYS_SHOWN);
  const remaining = card.days.length - shown.length;

  return (
    <article className="mt-3 overflow-hidden rounded-xl border border-stone-200 bg-white">
      <div className="sm:flex">
        <div className="relative h-40 w-full shrink-0 bg-stone-100 sm:h-auto sm:w-40">
          {card.coverPhotoUrl && (
            <Image
              src={card.coverPhotoUrl}
              alt=""
              fill
              unoptimized
              sizes="160px"
              className="object-cover"
            />
          )}
        </div>

        <div className="min-w-0 flex-1 p-4">
          <h3 className="font-display text-base font-bold leading-snug text-stone-900">
            {card.title}
          </h3>
          <p className="mt-1 text-xs text-stone-500">
            {[
              CATEGORY_LABEL[card.category] ?? card.category,
              `${card.durationDays} days`,
              DIFFICULTY_LABEL[card.difficulty] ?? card.difficulty,
            ].join("  •  ")}
          </p>

          {shown.length > 0 && (
            <ol className="mt-3 space-y-1">
              {shown.map((day) => (
                <li key={day.dayNumber} className="flex gap-3 text-xs leading-relaxed">
                  <span className="w-11 shrink-0 font-semibold text-brass-600">
                    Day {day.dayNumber}
                  </span>
                  <span className="min-w-0 text-stone-700">
                    {day.title}
                    {day.destination && (
                      <span className="text-stone-400"> — {day.destination}</span>
                    )}
                  </span>
                </li>
              ))}
              {remaining > 0 && (
                <li className="pl-14 text-xs text-stone-400">
                  + {remaining} more {remaining === 1 ? "day" : "days"}
                </li>
              )}
            </ol>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Link
              href={`/packages/${card.slug}`}
              className="inline-flex items-center gap-2 rounded-full bg-brass-500 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-brass-600"
            >
              View full itinerary
              <span aria-hidden>→</span>
            </Link>
            <p className="text-xs text-stone-500">
              from{" "}
              <Money
                btn={card.pricePerPersonBTN}
                className="font-display text-sm font-bold text-stone-900"
              />{" "}
              per person
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
