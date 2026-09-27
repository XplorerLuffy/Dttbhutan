import Link from "next/link";

/**
 * Full-bleed band of the four reasons to book with Droelma.
 *
 * Each claim here is one the site already makes and can stand behind (TCB
 * licensing, direct booking, custom itineraries) — the stat strip below is
 * counted from the database at request time rather than written in, so it
 * can't drift out of date or overstate the catalogue.
 */

const PILLARS = [
  {
    eyebrow: "Your trip",
    title: "Your way",
    body: "Take a ready-made journey as it stands, or tell us what you want to see and we'll shape the itinerary around your interests, dates and pace.",
  },
  {
    eyebrow: "Licensed",
    title: "Local guides",
    body: "Every guide listed carries a Tourism Council of Bhutan licence number and is reviewed by our team before they can accept a single booking.",
  },
  {
    eyebrow: "Grounded in",
    title: "Bhutan itself",
    body: "Routes are built on local knowledge of the dzongkhags — which festivals fall when, which trails open in which season, and what is worth your time.",
  },
  {
    eyebrow: "Book",
    title: "Directly",
    body: "Reserve packages, guides and transport straight through Droelma, with real availability and a confirmation you can hold us to.",
  },
];

export default function ValueBand({
  packageCount,
  destinationCount,
  ratingAverage,
  ratingCount,
}: {
  packageCount: number;
  destinationCount: number;
  ratingAverage: number | null;
  ratingCount: number;
}) {
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
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-semibold leading-tight text-brand-900 sm:text-4xl">
            Bhutan, Arranged Properly
          </h2>
          <p className="mt-4 text-base leading-relaxed text-stone-600">
            Bhutan asks every visitor to travel with a licensed guide and a planned itinerary. We
            handle that part so the trip still feels like yours.{" "}
            <Link href="/about" className="font-medium text-brand-700 underline underline-offset-4 hover:text-brand-800">
              About Droelma
            </Link>
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map((p) => (
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
        </div>

        {stats.length > 0 && (
          <div className="mt-14 flex flex-wrap items-start justify-center gap-x-16 gap-y-8 border-t border-brand-200/70 pt-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <p className="font-display text-4xl font-semibold text-brand-800">{s.value}</p>
                <p className="mt-1 text-sm text-stone-600">{s.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
