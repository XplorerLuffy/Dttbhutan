import Link from "next/link";
import Money from "@/components/Money";
import PhotoPlaceholder from "@/components/PhotoPlaceholder";
import ScrollReveal from "@/components/ScrollReveal";
import type { SiteContent } from "@/lib/content";

/**
 * Horizontally scrolling row of collection cards.
 *
 * A collection is one package category, so every card lands on a real,
 * already-working filter (/packages?category=…) rather than a curated page
 * that would need maintaining. The wording is editable; the trip count and
 * the "from" price are counted at request time, so a card can't advertise
 * eight trips when there are two.
 *
 * Empty categories are dropped upstream rather than rendered as a card that
 * leads to no results.
 */

export type Collection = {
  category: string;
  count: number;
  fromPrice: number;
  /** A cover photo from one of the tours in this collection, when any has one. */
  photoUrl: string | null;
};

export default function FeaturedCollections({
  content,
  collections,
}: {
  content: SiteContent;
  collections: Collection[];
}) {
  if (collections.length === 0) return null;

  return (
    <div>
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
          {content("home.collections.heading")}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          {content("home.collections.subtitle")}
        </p>
      </div>

      {/* Scroll-snap row rather than a grid: the partially visible next card
          is what tells people there is more to swipe, which a wrapped grid
          loses. Negative margins let the cards run to the screen edge while
          the section itself stays in the page container. */}
      <ScrollReveal
        className="no-scrollbar -mx-4 mt-12 flex snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6"
        stagger={0.06}
      >
        {collections.map((c) => (
          <Link
            key={c.category}
            href={`/packages?category=${c.category}`}
            className="group relative w-[78vw] max-w-[340px] shrink-0 snap-start overflow-hidden rounded-2xl sm:w-[340px]"
          >
            <div className="aspect-[4/5]">
              {c.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.photoUrl}
                  alt=""
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                />
              ) : (
                <PhotoPlaceholder
                  label={content(`home.collections.${c.category}.title`)}
                  className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
                />
              )}
            </div>

            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 p-6 text-white">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/70">
                {c.count} {c.count === 1 ? "trip" : "trips"} · from{" "}
                <Money btn={c.fromPrice} />
              </p>
              <h3 className="mt-2 font-display text-2xl font-semibold leading-tight">
                {content(`home.collections.${c.category}.title`)}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-white/85">
                {content(`home.collections.${c.category}.subtitle`)}
                <span aria-hidden className="transition-transform group-hover:translate-x-1">
                  ›
                </span>
              </p>
            </div>
          </Link>
        ))}
      </ScrollReveal>
    </div>
  );
}
