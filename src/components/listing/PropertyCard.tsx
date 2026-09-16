import Image from "next/image";
import MotionCard from "@/components/MotionCard";
import RatingBadge from "./RatingBadge";

/**
 * A Booking.com homepage-style vertical property card: photo on top,
 * details below, rating + price at the bottom. Distinct from ListingRow
 * (the horizontal search-results layout) — this is for featured-item
 * carousels/grids like the homepage's "Popular stays".
 */
export default function PropertyCard({
  href,
  imageUrl,
  imageFallback,
  title,
  subtitle,
  ratingAverage,
  ratingCount,
  priceLabel,
  priceSubLabel,
}: {
  href: string;
  imageUrl?: string | null;
  imageFallback: string;
  title: string;
  subtitle?: string;
  ratingAverage: number | null;
  ratingCount: number;
  priceLabel: string;
  priceSubLabel?: string;
}) {
  return (
    <MotionCard href={href} className="block overflow-hidden rounded-lg border border-stone-200 bg-white shadow-sm">
      <div className="relative h-40 w-full overflow-hidden bg-brand-50">
        {imageUrl ? (
          <Image src={imageUrl} alt={title} fill unoptimized className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center font-display text-3xl text-brand-300">
            {imageFallback}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="truncate font-display text-base font-semibold text-stone-900">{title}</h3>
        {subtitle && <p className="mt-0.5 truncate text-xs text-stone-500">{subtitle}</p>}
        <div className="mt-2 flex items-center justify-between gap-2">
          <RatingBadge average={ratingAverage} count={ratingCount} />
        </div>
        <div className="mt-2 border-t border-stone-100 pt-2 text-right">
          {priceSubLabel && <p className="text-xs text-stone-500">{priceSubLabel}</p>}
          <p className="font-display text-base font-bold text-brand-800">{priceLabel}</p>
        </div>
      </div>
    </MotionCard>
  );
}
