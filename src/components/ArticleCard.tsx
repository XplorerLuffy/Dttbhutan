import Image from "next/image";
import MotionCard from "@/components/MotionCard";

/**
 * Shared travel-guide article card — used on both the homepage's "From the
 * Travel Guide" section and the full /travel-guide listing, so the two stay
 * visually identical rather than drifting apart as separate copies.
 */
export default function ArticleCard({
  href,
  coverPhotoUrl,
  category,
  title,
  excerpt,
  readMinutes,
}: {
  href: string;
  coverPhotoUrl: string | null;
  category: string;
  title: string;
  excerpt?: string;
  readMinutes: number;
}) {
  return (
    <MotionCard href={href} className="card block overflow-hidden">
      {coverPhotoUrl ? (
        <div className="-mx-4 -mt-4 mb-3 h-36 w-[calc(100%+2rem)] overflow-hidden">
          <Image
            src={coverPhotoUrl}
            alt={title}
            width={400}
            height={200}
            unoptimized
            className="h-full w-full object-cover"
          />
        </div>
      ) : (
        <div className="-mx-4 -mt-4 mb-3 flex h-36 w-[calc(100%+2rem)] items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900">
          <span className="font-display text-3xl text-white/30">{title[0]}</span>
        </div>
      )}
      <span className="inline-block rounded-md border border-stone-300 px-2.5 py-1 text-xs font-semibold text-stone-700">
        {category.toUpperCase()}
      </span>
      <h3 className="mt-2 font-display text-base font-semibold text-stone-900">{title}</h3>
      {excerpt && <p className="mt-1 line-clamp-2 text-sm text-stone-600">{excerpt}</p>}
      <p className="mt-2 flex items-center gap-1 text-xs text-stone-400">
        <IconClock className="h-3.5 w-3.5" />
        {readMinutes} min read
      </p>
    </MotionCard>
  );
}

function IconClock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M12 7v5l3.5 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
