"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import RatingBadge from "./RatingBadge";

/**
 * A package/trek card for featured homepage carousels: photo with a
 * nights/days badge, title, locations, rating, and price — followed by two
 * separate actions (View Details / Enquire Now) rather than one big link,
 * since "enquire" and "view" go to different places. That rules out
 * MotionCard (which wraps everything in a single <Link>), so the hover
 * lift is reproduced here on a plain div instead.
 */
export default function PackageCard({
  href,
  enquireHref,
  imageUrl,
  imageFallback,
  title,
  subtitle,
  durationDays,
  ratingAverage,
  ratingCount,
  priceLabel,
  priceSubLabel,
}: {
  href: string;
  enquireHref: string;
  imageUrl?: string | null;
  imageFallback: string;
  title: string;
  subtitle?: string;
  durationDays: number;
  ratingAverage: number | null;
  ratingCount: number;
  priceLabel: React.ReactNode;
  priceSubLabel?: string;
}) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <motion.div
      whileHover={prefersReducedMotion ? undefined : { y: -4, boxShadow: "0 16px 28px -12px rgba(69,18,32,0.25)" }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm"
    >
      <Link href={href} className="block">
        <div className="relative h-40 w-full overflow-hidden bg-brand-50">
          {imageUrl ? (
            <Image src={imageUrl} alt={title} fill unoptimized className="object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-3xl text-brand-300">
              {imageFallback}
            </div>
          )}
          <span className="absolute left-2 top-2 rounded-md bg-stone-900/80 px-2 py-1 text-xs font-semibold text-white">
            {durationDays - 1}N / {durationDays}D
          </span>
        </div>
        <div className="px-3 pt-3">
          <h3 className="truncate font-display text-base font-semibold text-stone-900">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-xs text-stone-500">{subtitle}</p>}
          <div className="mt-2">
            <RatingBadge average={ratingAverage} count={ratingCount} />
          </div>
          <div className="mt-2 border-t border-stone-100 pt-2">
            {priceSubLabel && <p className="text-xs text-stone-500">{priceSubLabel}</p>}
            <p className="font-display text-base font-bold text-brand-800">{priceLabel}</p>
          </div>
        </div>
      </Link>
      <div className="flex gap-2 p-3 pt-2">
        <Link href={href} className="btn-primary flex-1 text-center text-sm">
          View Trip
        </Link>
        <Link href={enquireHref} className="btn-secondary flex-1 text-center text-sm">
          Enquire Now
        </Link>
      </div>
    </motion.div>
  );
}
