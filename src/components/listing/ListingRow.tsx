import Image from "next/image";
import MotionCard from "@/components/MotionCard";
import RatingBadge from "./RatingBadge";

/**
 * A Booking.com-style horizontal listing card: photo on the left, details
 * in the middle, rating + price/CTA on the right. Used across every
 * listing page (hotels, guides, vehicles, packages) so the browsing
 * experience feels like one consistent product rather than four.
 */
export default function ListingRow({
  href,
  imageUrl,
  imageFallback,
  badge,
  title,
  subtitle,
  tags,
  ratingAverage,
  ratingCount,
  priceLabel,
  priceSubLabel,
  ctaLabel = "See details",
}: {
  href: string;
  imageUrl?: string | null;
  imageFallback: string;
  badge?: string;
  title: string;
  subtitle?: string;
  tags?: string[];
  ratingAverage: number | null;
  ratingCount: number;
  priceLabel: string;
  priceSubLabel?: string;
  ctaLabel?: string;
}) {
  return (
    <MotionCard href={href} className="listing-row">
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-brand-50 sm:h-auto sm:w-64">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-4xl text-brand-300">
            {imageFallback}
          </div>
        )}
        {badge && (
          <span className="absolute left-2 top-2 rounded bg-white/95 px-2 py-0.5 text-xs font-semibold text-brand-800 shadow">
            {badge}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-between gap-4 p-4">
        <div>
          <h3 className="font-display text-lg font-semibold text-stone-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-sm text-stone-500">{subtitle}</p>}
          {tags && tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((t) => (
                <span key={t} className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                  {t}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3 border-t border-stone-100 pt-3">
          <RatingBadge average={ratingAverage} count={ratingCount} />
          <div className="text-right">
            {priceSubLabel && <p className="text-xs text-stone-500">{priceSubLabel}</p>}
            <p className="font-display text-xl font-bold text-brand-800">{priceLabel}</p>
            <span className="mt-1 inline-block text-xs font-medium text-brand-700">{ctaLabel} →</span>
          </div>
        </div>
      </div>
    </MotionCard>
  );
}
