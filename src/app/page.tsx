import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Hero from "@/components/home/Hero";
import ScrollReveal from "@/components/ScrollReveal";
import MotionCard from "@/components/MotionCard";

const categories = [
  {
    href: "/guides",
    title: "Tour Guides",
    description:
      "TCB-licensed guides for trekking, cultural, historical, and adventure tours.",
  },
  {
    href: "/hotels",
    title: "Hotels & Stays",
    description: "Hotels and homestays across Bhutan, with instant availability.",
  },
  {
    href: "/vehicles",
    title: "Transport",
    description:
      "Vehicles with drivers, GPS-tracked so you always know actual trip distance.",
  },
  {
    href: "/flights",
    title: "Flights",
    description: "Search and book flights, with Drukair and Bhutan Airlines routes pinned first.",
  },
];

const trustPoints = [
  {
    title: "GPS-verified mileage",
    description:
      "Every vehicle trip is checked against its GPS trail, not the driver's word — the exact planned-vs-actual distance is on record.",
  },
  {
    title: "Licensed & vetted vendors",
    description:
      "Guides carry a verified TCB license, and every hotel and transport operator is approved by our team before they're bookable.",
  },
  {
    title: "Live trip tracking",
    description:
      "Follow your vehicle's last known location during your trip, and share the link with family — no account needed.",
  },
];

export default async function HomePage() {
  const [destinations, featuredPackages] = await Promise.all([
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { pricePerPerson: "asc" },
      take: 3,
    }),
  ]);
  const featuredDestinations = destinations.slice(0, 8);

  return (
    <div>
      <Hero destinations={destinations} />

      <section className="mt-16">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
          Everything for your trip, in one place
        </h2>
        <ScrollReveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <MotionCard key={c.href} href={c.href} className="card block h-full">
              <h3 className="font-display text-lg font-semibold text-brand-800">{c.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{c.description}</p>
            </MotionCard>
          ))}
        </ScrollReveal>
      </section>

      {featuredPackages.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">Package tours</h2>
            <Link href="/packages" className="text-sm text-brand-700 hover:underline">
              View all →
            </Link>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Ready-made itineraries, or{" "}
            <Link href="/custom-tour" className="text-brand-700 hover:underline">
              request a custom tour
            </Link>{" "}
            built around what you want to see.
          </p>
          <ScrollReveal className="mt-6 grid gap-4 sm:grid-cols-3">
            {featuredPackages.map((p) => (
              <MotionCard key={p.id} href={`/packages/${p.slug}`} className="card block">
                <h3 className="font-semibold">{p.title}</h3>
                <p className="mt-1 text-sm text-stone-600">{p.summary}</p>
                <p className="mt-2 text-sm text-stone-500">{p.durationDays} days</p>
                <p className="mt-1 font-medium text-brand-800">
                  Nu. {Number(p.pricePerPerson).toLocaleString()} / person
                </p>
              </MotionCard>
            ))}
          </ScrollReveal>
        </section>
      )}

      <section className="mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-stone-900">
            Bhutan&apos;s 20 dzongkhags
          </h2>
          <Link href="/destinations" className="text-sm text-brand-700 hover:underline">
            View all →
          </Link>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          From the well-trodden west to the far east, visited by only a handful of travelers each year.
        </p>
        <ScrollReveal className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {featuredDestinations.map((d) => (
            <MotionCard key={d.id} href={`/destinations/${d.slug}`} className="card block text-center">
              <span className="font-medium">{d.name}</span>
            </MotionCard>
          ))}
        </ScrollReveal>
      </section>

      <section className="mt-20">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
          Built to solve real problems, not just look nice
        </h2>
        <ScrollReveal className="mt-8 grid gap-8 sm:grid-cols-3">
          {trustPoints.map((t) => (
            <div key={t.title} className="text-center">
              <h3 className="font-display text-lg font-semibold text-pine-800">{t.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{t.description}</p>
            </div>
          ))}
        </ScrollReveal>
      </section>
    </div>
  );
}
