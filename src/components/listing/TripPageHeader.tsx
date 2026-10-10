import Image from "next/image";
import Link from "next/link";
import type { TripDifficulty } from "@prisma/client";

export type TripHeaderStats = {
  durationDays: number;
  difficulty: TripDifficulty;
  maxGroupSize: number | null;
  /** Pre-formatted, e.g. "2026: Oct · 2027: Feb–Apr, Oct". Empty when none. */
  departureMonths: string;
};

const DIFFICULTY_LABEL: Record<TripDifficulty, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

/**
 * The masthead of a trip page: breadcrumb, the photograph, then the category,
 * the trip's name, and the four facts people scan for.
 *
 * The photograph comes first because it is what the page is selling — on a
 * phone the title and the four stats were pushing it a screen and a half down,
 * so the page opened on a wall of text and the trip itself was below the fold.
 *
 * The title still sits on white *under* the photo rather than over it. Text on
 * an unvetted photograph is a contrast gamble — every new cover image is a
 * chance for the headline to land on a white sky — and keeping the type off it
 * also lets the photograph run full-bleed without a scrim dulling it.
 */
export default function TripPageHeader({
  title,
  categoryLabel,
  categoryHref,
  imageUrl,
  galleryHref,
  stats,
  ratingAverage,
  ratingCount,
}: {
  title: string;
  categoryLabel: string;
  categoryHref: string;
  imageUrl?: string | null;
  /** Anchor for the "View gallery" button over the photo. Omitted when the
   * trip has no gallery photos, so the button never leads to an empty section. */
  galleryHref?: string | null;
  stats: TripHeaderStats;
  ratingAverage: number | null;
  ratingCount: number;
}) {
  const nights = stats.durationDays - 1;

  return (
    <header>
      <div className="border-b border-stone-200 bg-stone-100/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 sm:px-6">
          <nav aria-label="Breadcrumb" className="text-sm text-stone-600">
            <Link href="/" className="transition-colors hover:text-stone-900">
              Home
            </Link>
            <span aria-hidden className="mx-2 text-stone-400">
              ›
            </span>
            <Link href="/packages" className="transition-colors hover:text-stone-900">
              Tour packages
            </Link>
            <span aria-hidden className="mx-2 text-stone-400">
              ›
            </span>
            <span className="text-stone-900">Bhutan</span>
          </nav>

          <Link
            href={categoryHref}
            className="rounded bg-pine-600 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white transition-colors hover:bg-pine-700"
          >
            {categoryLabel}
          </Link>

          {ratingAverage !== null && ratingCount > 0 && (
            <p className="ml-auto flex items-center gap-2 text-sm">
              <span aria-hidden className="text-gold-500">
                ★
              </span>
              <span className="font-bold text-stone-900">{ratingAverage.toFixed(1)}</span>
              <span aria-hidden className="text-stone-300">
                ·
              </span>
              <a href="#reviews" className="text-brand-700 underline underline-offset-2">
                {ratingCount} review{ratingCount === 1 ? "" : "s"}
              </a>
            </p>
          )}
        </div>
      </div>

      <div className="relative h-[38vh] min-h-[260px] w-full bg-gradient-to-br from-brand-600 to-brand-950 sm:h-[54vh]">
        {imageUrl && (
          <Image src={imageUrl} alt={`${title}: Bhutan tour package`} fill priority unoptimized className="object-cover" />
        )}
        {galleryHref && (
          <a
            href={galleryHref}
            className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-white/95 px-5 py-2.5 text-sm font-semibold text-stone-900 shadow-md backdrop-blur transition-colors hover:bg-white"
          >
            View gallery
          </a>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 pb-5 pt-7 sm:px-6 sm:pb-6 sm:pt-10">
        <h1 className="text-center font-display text-3xl font-bold leading-tight text-stone-900 sm:text-5xl">
          {title}
        </h1>
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <dl className="grid gap-x-6 gap-y-3 border-y border-stone-200 py-4 sm:gap-y-4 sm:py-5 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<ClockIcon />} label="Trip length">
            {stats.durationDays} days{nights > 0 && ` • ${nights} nights`}
          </Stat>
          <Stat icon={<GaugeIcon />} label="Activity level">
            {DIFFICULTY_LABEL[stats.difficulty]}
          </Stat>
          <Stat icon={<GroupIcon />} label="Group size">
            {stats.maxGroupSize ? `Up to ${stats.maxGroupSize}` : "Small group"}
          </Stat>
          <Stat icon={<CalendarIcon />} label="Departures">
            {stats.departureMonths || "On request"}
          </Stat>
        </dl>
      </div>

    </header>
  );
}

function Stat({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span aria-hidden className="shrink-0 text-brand-700">
        {icon}
      </span>
      <div className="min-w-0">
        <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</dt>
        <dd className="truncate font-display text-base font-semibold text-stone-900">{children}</dd>
      </div>
    </div>
  );
}

/* Inline rather than an icon package: four glyphs don't justify the bundle. */
const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" {...ICON}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function GaugeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" {...ICON}>
      <path d="M4 18a8 8 0 1 1 16 0" />
      <path d="M12 18l4-5" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" {...ICON}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19a5.5 5.5 0 0 1 11 0" />
      <path d="M16 6.2a3.2 3.2 0 0 1 0 6.1M17.5 19a5.6 5.6 0 0 0-2-4.3" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" {...ICON}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </svg>
  );
}
