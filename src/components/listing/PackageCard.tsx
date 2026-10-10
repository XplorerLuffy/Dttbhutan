"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import RatingBadge from "./RatingBadge";

export type PackageCardMeta = {
  label: string;
  value: string;
};

/**
 * A trip card for the homepage carousels: photo with a category badge and a
 * duration pill, then title, locations, a short spec table (activity level,
 * group size, next departure) and a "From <price> per person" line.
 *
 * The spec rows are passed in rather than derived here so a card can show
 * whatever its section actually knows — a trek card has a next departure,
 * a package without a published schedule simply has one row fewer. Rows are
 * label/value pairs, kept to three at most: the fourth turns the card into a
 * form and pushes the price below the fold of a three-up grid.
 *
 * "View Trip" and "Enquire Now" go to different places, so the card can't be
 * one big <Link> the way MotionCard is — the hover lift is reproduced here on
 * a plain div instead.
 */
export default function PackageCard({
  href,
  enquireHref,
  imageUrl,
  imageFallback,
  categoryLabel,
  title,
  subtitle,
  durationDays,
  meta = [],
  ratingAverage,
  ratingCount,
  priceLabel,
}: {
  href: string;
  enquireHref: string;
  imageUrl?: string | null;
  imageFallback: string;
  categoryLabel?: string;
  title: string;
  subtitle?: string;
  durationDays: number;
  meta?: PackageCardMeta[];
  ratingAverage: number | null;
  ratingCount: number;
  priceLabel: React.ReactNode;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={
        prefersReducedMotion
          ? undefined
          : { y: -4, boxShadow: "0 16px 28px -12px rgba(10,49,89,0.28)" }
      }
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="flex h-full flex-col overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm"
    >
      <Link href={href} className="block">
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-brand-50">
          {imageUrl ? (
            <Image src={imageUrl} alt={`${title}: Bhutan tour package`} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl text-brand-300">
              {imageFallback}
            </div>
          )}
          {categoryLabel && (
            <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-900 shadow-sm">
              {categoryLabel}
            </span>
          )}
          <span className="absolute right-3 top-3 rounded-full bg-stone-900/75 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            {durationDays} days
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col px-4 pb-4 pt-4">
        <Link href={href} className="block">
          <h3 className="font-display text-lg font-semibold leading-snug text-stone-900">
            {title}
          </h3>
          {subtitle && <p className="mt-1 line-clamp-2 text-sm text-stone-500">{subtitle}</p>}
        </Link>

        {meta.length > 0 && (
          <dl className="mt-4 space-y-1.5 border-t border-stone-100 pt-3 text-sm">
            {meta.map((row) => (
              <div key={row.label} className="flex items-baseline justify-between gap-3">
                <dt className="shrink-0 text-stone-500">{row.label}</dt>
                <dd className="truncate text-right font-medium text-stone-800">{row.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {ratingCount > 0 && (
          <div className="mt-3">
            <RatingBadge average={ratingAverage} count={ratingCount} />
          </div>
        )}

        {/* mt-auto pins the price and actions to the bottom, so cards of
            different title/subtitle lengths still line up across a grid row. */}
        <div className="mt-auto border-t border-stone-100 pt-3">
          <p className="font-display text-lg font-bold text-brand-800">
            <span className="mr-1 text-xs font-semibold uppercase tracking-wide text-stone-500">
              From
            </span>
            {priceLabel}
            <span className="ml-1 text-xs font-medium text-stone-500">/person</span>
          </p>
        </div>

        <div className="mt-3 flex gap-2">
          <Link href={href} className="btn-primary flex-1 text-center text-sm">
            View Trip
          </Link>
          <Link href={enquireHref} className="btn-secondary flex-1 text-center text-sm">
            Enquire Now
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
