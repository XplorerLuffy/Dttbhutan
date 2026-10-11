import Image from "next/image";
import Link from "next/link";

/**
 * Three ways in, as tall photo cards straight under the hero: the visitor who
 * hasn't picked a trip picks a kind of trip instead. Each opens the packages
 * list filtered to that style.
 *
 * On a phone the cards sit in a swipeable row that snaps card by card, with
 * the next card peeking in from the edge so it is obvious there is more to
 * swipe (the same way Backroads' "Featured Collections" row works). From
 * tablet width up all three fit, so they become an even row.
 */
const STYLES = [
  {
    label: "Culture & Heritage",
    subtitle: "Dzongs, festivals and living traditions",
    href: "/packages?category=CULTURAL",
    image: "/media/packages/cham-dance.webp",
  },
  {
    label: "Trekking & Adventure",
    subtitle: "High passes, prayer flags and big views",
    href: "/packages?category=TREKKING",
    image: "/media/packages/pass-prayer-flags.webp",
  },
  {
    label: "Wellness & Retreats",
    subtitle: "Quiet lodges and slow mornings",
    href: "/packages?category=HONEYMOON",
    image: "/media/packages/lodge-terrace.webp",
  },
];

export default function FindYourBhutan() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4 pt-14 sm:px-6 sm:pt-16">
      <h2 className="text-center font-display text-3xl font-bold text-brand-900 sm:text-4xl">
        Find Your Bhutan
      </h2>
      <ul
        className="no-scrollbar -mx-4 mt-8 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0 sm:pb-0"
        aria-label="Kinds of trip"
      >
        {STYLES.map((s, i) => (
          <li key={s.label} className="w-[78vw] max-w-[340px] shrink-0 snap-start sm:w-auto sm:max-w-none">
            <Link
              href={s.href}
              className="group relative block aspect-[4/5] overflow-hidden rounded-2xl shadow-md sm:aspect-[4/5]"
            >
              <Image
                src={s.image}
                alt={`${s.label}: ${s.subtitle}`}
                fill
                sizes="(min-width: 640px) 33vw, 78vw"
                priority={i === 0}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <h3 className="font-display text-2xl font-semibold leading-tight [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
                  {s.label}
                </h3>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-white/90">
                  {s.subtitle}
                  <span aria-hidden className="text-gold-400 transition-transform group-hover:translate-x-1">
                    ›
                  </span>
                </p>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
