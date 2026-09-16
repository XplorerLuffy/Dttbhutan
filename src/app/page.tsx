import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Hero from "@/components/home/Hero";
import ScrollReveal from "@/components/ScrollReveal";
import MotionCard from "@/components/MotionCard";
import PropertyCard from "@/components/listing/PropertyCard";
import TestimonialCarousel, { type Testimonial } from "@/components/home/TestimonialCarousel";
import Image from "next/image";

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

const whyChoose = [
  {
    title: "Licensed & vetted vendors",
    description:
      "Guides carry a verified TCB license, and every hotel and transport operator is approved by our team before they're bookable.",
    icon: IconShieldCheck,
  },
  {
    title: "GPS-verified mileage",
    description:
      "Every vehicle trip is checked against its GPS trail, not the driver's word — the exact planned-vs-actual distance is on record.",
    icon: IconMapPin,
  },
  {
    title: "Live trip tracking",
    description:
      "Follow your vehicle's last known location during your trip, and share the link with family — no account needed.",
    icon: IconUsers,
  },
  {
    title: "Ready-made or fully custom",
    description:
      "Book one of our priced itineraries as-is, or tell us what you want to see and we'll build a bespoke trip and quote it.",
    icon: IconSliders,
  },
];

export default async function HomePage() {
  const [destinations, trendingPackages, popularHotels, articles] = await Promise.all([
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { pricePerPerson: "asc" },
      take: 6,
      include: { days: { orderBy: { dayNumber: "asc" }, include: { destination: true } } },
    }),
    prisma.hotel.findMany({
      where: { status: "APPROVED" },
      take: 4,
      orderBy: { createdAt: "desc" },
      include: { destination: true, roomTypes: { orderBy: { pricePerNight: "asc" }, take: 1 } },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 3,
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

  const testimonials = await getTestimonials();

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

      {trendingPackages.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">Trending packages</h2>
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
          <ScrollReveal className="mt-6 flex gap-4 overflow-x-auto pb-2">
            {trendingPackages.map((p) => {
              const locations = uniqueOrdered(
                p.days.map((d) => d.destination?.name).filter((n): n is string => Boolean(n))
              );
              return (
                <div key={p.id} className="w-64 shrink-0">
                  <PropertyCard
                    href={`/packages/${p.slug}`}
                    imageUrl={p.coverPhotoUrl}
                    imageFallback={p.title[0]}
                    title={p.title}
                    subtitle={locations.join(" • ") || undefined}
                    ratingAverage={null}
                    ratingCount={0}
                    priceLabel={`Nu. ${Number(p.pricePerPerson).toLocaleString()}`}
                    priceSubLabel={`per person · ${p.durationDays}d`}
                  />
                </div>
              );
            })}
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

      {articles.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">From the Travel Guide</h2>
            <Link href="/travel-guide" className="text-sm text-brand-700 hover:underline">
              View all guides →
            </Link>
          </div>
          <ScrollReveal className="mt-6 grid gap-4 sm:grid-cols-3">
            {articles.map((a) => (
              <MotionCard key={a.id} href={`/travel-guide/${a.slug}`} className="card block overflow-hidden">
                {a.coverPhotoUrl ? (
                  <div className="-mx-4 -mt-4 mb-3 h-36 w-[calc(100%+2rem)] overflow-hidden">
                    <Image
                      src={a.coverPhotoUrl}
                      alt={a.title}
                      width={400}
                      height={200}
                      unoptimized
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="-mx-4 -mt-4 mb-3 flex h-36 w-[calc(100%+2rem)] items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900">
                    <span className="font-display text-3xl text-white/30">{a.title[0]}</span>
                  </div>
                )}
                <span className="badge bg-stone-100 text-stone-600">{a.category.toUpperCase()}</span>
                <h3 className="mt-2 font-display text-base font-semibold text-stone-900">{a.title}</h3>
                <p className="mt-2 text-xs text-stone-400">{a.readMinutes} min read</p>
              </MotionCard>
            ))}
          </ScrollReveal>
        </section>
      )}

      {testimonials.length > 0 && (
        <section className="mt-20">
          <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
            What our travelers say
          </h2>
          <div className="mt-8">
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}

      <section className="mt-20">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
          Why choose Droelma
        </h2>
        <ScrollReveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {whyChoose.map((t) => (
            <div key={t.title} className="card text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-pine-50">
                <t.icon className="h-6 w-6 text-pine-700" />
              </span>
              <h3 className="mt-3 font-display text-base font-semibold text-stone-900">{t.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{t.description}</p>
            </div>
          ))}
        </ScrollReveal>
      </section>
    </div>
  );
}

function uniqueOrdered(values: string[]) {
  return Array.from(new Set(values));
}

async function getTestimonials(): Promise<Testimonial[]> {
  const reviews = await prisma.review.findMany({
    where: { comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 6,
    include: { traveler: true },
  });
  if (reviews.length === 0) return [];

  const guideIds = reviews.filter((r) => r.targetType === "GUIDE").map((r) => r.targetId);
  const hotelIds = reviews.filter((r) => r.targetType === "HOTEL").map((r) => r.targetId);
  const vehicleIds = reviews.filter((r) => r.targetType === "VEHICLE").map((r) => r.targetId);

  const [guides, hotels, vehicles] = await Promise.all([
    prisma.guideProfile.findMany({ where: { id: { in: guideIds } }, include: { user: true } }),
    prisma.hotel.findMany({ where: { id: { in: hotelIds } } }),
    prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, include: { operator: true } }),
  ]);

  const labelById = new Map<string, string>();
  for (const g of guides) labelById.set(g.id, `Traveled with guide ${g.user.name}`);
  for (const h of hotels) labelById.set(h.id, `Stayed at ${h.name}`);
  for (const v of vehicles) labelById.set(v.id, `Rode with ${v.operator.businessName}`);

  return reviews
    .filter((r) => r.comment)
    .map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment as string,
      travelerName: r.traveler.name,
      contextLabel: labelById.get(r.targetId) ?? "Verified traveler",
    }));
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

function IconShieldCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 3l7 3v5c0 5-3.5 8-7 10-3.5-2-7-5-7-10V6l7-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMapPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconUsers({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 19c.7-3 3-5 6-5s5.3 2 6 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="17" cy="9" r="2.3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M15.5 14.2c2.3.4 4 2 4.6 4.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconSliders({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h13M21 18h-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="6" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="8" cy="12" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17" cy="18" r="2" fill="white" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
