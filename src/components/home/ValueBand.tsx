import Link from "next/link";
import ScrollReveal from "@/components/ScrollReveal";
import type { SiteContent } from "@/lib/content";

/**
 * Full-bleed band of the four reasons to book with Droelma.
 *
 * Each claim here is one the site already makes and can stand behind (TCB
 * licensing, direct booking, custom itineraries) — the stat strip below is
 * counted from the database at request time rather than written in, so it
 * can't drift out of date or overstate the catalogue.
 */


export default function ValueBand({
  content,
  packageCount,
  destinationCount,
  ratingAverage,
  ratingCount,
}: {
  content: SiteContent;
  packageCount: number;
  destinationCount: number;
  ratingAverage: number | null;
  ratingCount: number;
}) {
  const pillars = [1, 2, 3, 4].map((n) => ({
    eyebrow: content(`home.valueband.pillar${n}.eyebrow`),
    title: content(`home.valueband.pillar${n}.title`),
    body: content(`home.valueband.pillar${n}.body`),
  }));

  const stats = [
    { value: String(packageCount), label: packageCount === 1 ? "Tour package" : "Tour packages" },
    { value: String(destinationCount), label: "Dzongkhags covered" },
    ...(ratingAverage !== null && ratingCount > 0
      ? [
          {
            value: ratingAverage.toFixed(1),
            label: `Average of ${ratingCount} traveler ${ratingCount === 1 ? "review" : "reviews"}`,
          },
        ]
      : []),
  ];

  return (
    <section className="bg-brand-50/70 py-20 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ScrollReveal className="mx-auto max-w-2xl text-center" stagger={0.08}>
          <h2 className="font-display text-3xl font-semibold leading-tight text-brand-900 sm:text-4xl">
            {content("home.valueband.heading")}
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            {content("home.valueband.subheading")}{" "}
            <Link href="/about" className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800">
              {content("home.valueband.linkLabel")}
            </Link>
          </p>
        </ScrollReveal>

        <ScrollReveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {pillars.map((p) => (
            <div key={p.title} className="bg-white px-6 py-10 text-center shadow-sm">
              <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-brand-700">
                {p.eyebrow}
              </p>
              <p className="mt-1 font-display text-2xl font-bold uppercase tracking-tight text-brand-900">
                {p.title}
              </p>
              <span className="mx-auto mt-4 block h-0.5 w-10 bg-gold-400" />
              <p className="mt-5 text-sm leading-relaxed text-stone-600">{p.body}</p>
            </div>
          ))}
        </ScrollReveal>

        {stats.length > 0 && (
          <ScrollReveal className="mt-14 flex flex-wrap items-start justify-center gap-x-16 gap-y-8 border-t border-brand-200/70 pt-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-4xl font-semibold text-brand-800">{s.value}</p>
                <p className="mt-1 text-sm text-stone-600">{s.label}</p>
              </div>
            ))}
          </ScrollReveal>
        )}
      </div>
    </section>
  );
}
