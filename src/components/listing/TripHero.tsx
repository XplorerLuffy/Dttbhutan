import Image from "next/image";
import Link from "next/link";
import type { TripDifficulty } from "@prisma/client";
import ActivityLevel from "./ActivityLevel";

/**
 * Full-bleed hero for a trip page: the cover photo running edge to edge with
 * the trip's name over it, and an "at a glance" card overlapping its bottom
 * edge with the four things a visitor decides on — how long, how hard, how
 * many people, how much.
 *
 * The overlay is a gradient rather than a flat scrim so the top of the photo
 * stays visible; the text sits in the darkest part at the bottom, which is
 * what keeps it legible over a photo nobody has vetted for contrast. Without
 * a cover photo the same block runs over the brand gradient instead, so the
 * layout doesn't collapse while the client's photography is outstanding.
 */
export default function TripHero({
  title,
  summary,
  categoryLabel,
  imageUrl,
  durationDays,
  difficulty,
  maxGroupSize,
  price,
  datesHref = "#dates",
}: {
  title: string;
  summary: string;
  categoryLabel: string;
  imageUrl?: string | null;
  durationDays: number;
  difficulty: TripDifficulty;
  maxGroupSize: number | null;
  price: React.ReactNode;
  datesHref?: string;
}) {
  return (
    <section className="relative">
      <div className="relative h-[52vh] min-h-[380px] w-full overflow-hidden bg-gradient-to-br from-brand-600 to-brand-950 sm:h-[60vh]">
        {imageUrl && (
          <Image src={imageUrl} alt={title} fill priority unoptimized className="object-cover" />
        )}
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-brand-950/90 via-brand-950/45 to-brand-950/10"
        />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
            <nav aria-label="Breadcrumb" className="mb-3 text-sm text-white/70">
              <Link href="/packages" className="transition-colors hover:text-white">
                Tour packages
              </Link>
              <span aria-hidden className="mx-2">
                /
              </span>
              <span className="text-white/90">{categoryLabel}</span>
            </nav>
            <h1 className="max-w-3xl font-display text-3xl font-bold leading-tight text-white drop-shadow-sm sm:text-5xl">
              {title}
            </h1>
            <p className="mt-3 max-w-2xl text-base text-white/85 sm:text-lg">{summary}</p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* The price column sizes to its content (`auto`) rather than taking
            an equal quarter — an equal share wraps "Nu. 30,000" across two
            lines, and a converted currency is longer still. */}
        <div className="relative -mt-8 grid gap-x-8 gap-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-lg sm:grid-cols-2 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto] lg:items-center">
          <Stat label="Trip length">
            <span className="font-display text-lg font-bold text-stone-900">
              {durationDays} days
            </span>
            {durationDays > 1 && (
              <span className="ml-1 text-sm text-stone-500">/ {durationDays - 1} nights</span>
            )}
          </Stat>

          <Stat label="Activity level">
            <ActivityLevel difficulty={difficulty} />
          </Stat>

          <Stat label="Group size">
            <span className="font-display text-lg font-bold text-stone-900">
              {maxGroupSize ? `Up to ${maxGroupSize}` : "Small group"}
            </span>
          </Stat>

          <div className="flex items-center justify-between gap-4 sm:col-span-2 lg:col-span-1 lg:justify-end">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">
                From
              </p>
              <p className="whitespace-nowrap font-display text-xl font-bold text-brand-800">
                {price}
              </p>
              <p className="text-xs text-stone-500">per person</p>
            </div>
            <a
              href={datesHref}
              className="shrink-0 rounded-full bg-gold-500 px-6 py-3 font-semibold text-white transition-colors hover:bg-gold-600"
            >
              View dates
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-stone-500">
        {label}
      </p>
      {children}
    </div>
  );
}
