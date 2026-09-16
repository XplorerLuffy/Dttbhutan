import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Hero from "@/components/home/Hero";
import ScrollReveal from "@/components/ScrollReveal";
import MotionCard from "@/components/MotionCard";
import PropertyCard from "@/components/listing/PropertyCard";

const categories = [
  {
    href: "/guides",
    title: "Tour Guides",
    description: "TCB-licensed guides for trekking, cultural, and adventure tours.",
    icon: IconCompass,
  },
  {
    href: "/hotels",
    title: "Hotels & Stays",
    description: "Hotels and homestays across Bhutan, with instant availability.",
    icon: IconBed,
  },
  {
    href: "/vehicles",
    title: "Transport",
    description: "Vehicles with drivers, GPS-tracked so you know actual trip distance.",
    icon: IconCar,
  },
  {
    href: "/flights",
    title: "Flights",
    description: "Search and book flights, with Drukair and Bhutan Airlines routes first.",
    icon: IconPlane,
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
  const [destinations, featuredPackages, popularHotels] = await Promise.all([
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { pricePerPerson: "asc" },
      take: 3,
    }),
    prisma.hotel.findMany({
      where: { status: "APPROVED" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { destination: true, roomTypes: { orderBy: { pricePerNight: "asc" }, take: 1 } },
    }),
  ]);
  const featuredDestinations = destinations.slice(0, 8);

  const hotelRatings = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetType: "HOTEL", targetId: { in: popularHotels.map((h) => h.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingById = new Map(hotelRatings.map((r) => [r.targetId, r]));

  return (
    <div>
      <Hero destinations={destinations} />

      <section className="mt-14">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
          Everything for your trip, in one place
        </h2>
        <ScrollReveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((c) => (
            <MotionCard key={c.href} href={c.href} className="card block h-full">
              <c.icon className="h-8 w-8 text-brand-600" />
              <h3 className="mt-3 font-display text-lg font-semibold text-brand-800">{c.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{c.description}</p>
            </MotionCard>
          ))}
        </ScrollReveal>
      </section>

      {popularHotels.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">Popular stays</h2>
            <Link href="/hotels" className="text-sm text-brand-700 hover:underline">
              View all →
            </Link>
          </div>
          <p className="mt-1 text-sm text-stone-600">Hand-picked hotels and homestays travelers book most.</p>
          <ScrollReveal className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {popularHotels.map((h) => {
              const rating = ratingById.get(h.id);
              return (
                <PropertyCard
                  key={h.id}
                  href={`/hotels/${h.id}`}
                  imageUrl={h.photoUrls[0]}
                  imageFallback={h.name[0]}
                  title={h.name}
                  subtitle={h.destination.name}
                  ratingAverage={rating?._avg.rating ?? null}
                  ratingCount={rating?._count.rating ?? 0}
                  priceLabel={
                    h.roomTypes[0]
                      ? `Nu. ${Number(h.roomTypes[0].pricePerNight).toLocaleString()}`
                      : "Contact for price"
                  }
                  priceSubLabel={h.roomTypes[0] ? "per night" : undefined}
                />
              );
            })}
          </ScrollReveal>
        </section>
      )}

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

function IconCompass({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15 9l-2 6-6 2 2-6 6-2z" fill="currentColor" />
    </svg>
  );
}

function IconBed({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 18v2M21 18v2M3 13h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="5" y="9" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconCar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 16v-3l2-5h12l2 5v3M4 16h16M4 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2M17 16v2a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-2"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="7.5" cy="16" r="1" fill="currentColor" />
      <circle cx="16.5" cy="16" r="1" fill="currentColor" />
    </svg>
  );
}

function IconPlane({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M10.5 20l1.5-4.5L21 12l-1-2-8.5 2L9 6H7l1 6.5L2 15l1 2 4.5-1.5L9 20h1.5z"
        fill="currentColor"
      />
    </svg>
  );
}
