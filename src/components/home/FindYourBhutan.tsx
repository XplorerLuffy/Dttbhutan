import Image from "next/image";
import Link from "next/link";

/**
 * Three ways in, as large photo cards straight under the hero: the visitor
 * who hasn't picked a trip picks a kind of trip instead. Each opens the
 * packages list filtered to that style.
 */
const STYLES = [
  { label: "Culture & Heritage", href: "/packages?category=CULTURAL", image: "/media/packages/cham-dance.webp" },
  { label: "Trekking & Adventure", href: "/packages?category=TREKKING", image: "/media/packages/pass-prayer-flags.webp" },
  { label: "Wellness & Retreats", href: "/packages?category=HONEYMOON", image: "/media/packages/lodge-terrace.webp" },
];

export default function FindYourBhutan() {
  return (
    <section className="mx-auto max-w-6xl px-4 pb-4 pt-14 sm:px-6 sm:pt-16">
      <h2 className="text-center font-display text-3xl font-bold text-brand-900 sm:text-4xl">
        Find Your Bhutan
      </h2>
      <div className="mt-8 grid gap-5 sm:grid-cols-3">
        {STYLES.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group relative block aspect-[4/3] overflow-hidden rounded-xl shadow-md"
          >
            <Image
              src={s.image}
              alt=""
              fill
              sizes="(min-width: 640px) 33vw, 100vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
            <span className="absolute bottom-4 left-5 font-display text-xl font-semibold text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">
              {s.label} <span className="text-gold-400">→</span>
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
