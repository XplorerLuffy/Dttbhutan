import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Hero from "@/components/home/Hero";
import ScrollReveal from "@/components/ScrollReveal";
import MotionCard from "@/components/MotionCard";
import PackageCard from "@/components/listing/PackageCard";
import DestinationCard from "@/components/home/DestinationCard";
import GuideCard from "@/components/home/GuideCard";
import ArticleCard from "@/components/ArticleCard";
import AiPlannerTeaser from "@/components/home/AiPlannerTeaser";
import TestimonialCarousel, { type Testimonial } from "@/components/home/TestimonialCarousel";
import Money from "@/components/Money";
import type { Itinerary, ItineraryDay, Destination } from "@prisma/client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bhutan Tours, Local Guides & Custom Trips",
  description:
    "Discover Bhutan, your way — explore tour packages, meet verified local guides, or build a custom trip with Droelma Tours & Travels and book directly online.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Droelma Tours & Travels | Bhutan Tours, Local Guides & Custom Trips",
    description:
      "Discover Bhutan, your way — explore tour packages, meet verified local guides, or build a custom trip and book directly online.",
    url: "/",
  },
};

const quickActions = [
  {
    href: "/packages",
    title: "Tours & Packages",
    description: "Explore ready-made Bhutan journeys, priced and planned end to end.",
    icon: IconCompass,
  },
  {
    href: "/guides",
    title: "Tour Guides",
    description: "Meet verified local Bhutan guides, by language, specialty, and region.",
    icon: IconUsers,
  },
  {
    href: "/custom-tour",
    title: "Custom Trip",
    description: "Build a Bhutan journey around your interests, dates, and pace.",
    icon: IconSliders,
  },
];

const whyChoose = [
  {
    title: "Local Bhutan Expertise",
    description:
      "Every itinerary and guide on Droelma is grounded in local knowledge of Bhutan's dzongkhags, festivals, and trekking routes.",
    icon: IconMapPin,
  },
  {
    title: "Verified Local Guides",
    description:
      "Every guide listed carries a TCB licence number and is manually approved by our team before they can take bookings.",
    icon: IconShieldCheck,
  },
  {
    title: "Flexible Trip Planning",
    description:
      "Book a tour package as-is, or tell us what you want to see and we'll shape a custom itinerary around it.",
    icon: IconSliders,
  },
  {
    title: "Direct Online Booking",
    description:
      "Reserve packages, guides, and transport directly through Droelma, with real availability and confirmation.",
    icon: IconCheckCircle,
  },
];

const howItWorks = [
  {
    step: "1",
    title: "Discover",
    description: "Explore Bhutan's destinations, tours, and local guides.",
    icon: IconCompass,
  },
  {
    step: "2",
    title: "Plan",
    description: "Choose a tour package or build your own trip.",
    icon: IconSliders,
  },
  {
    step: "3",
    title: "Book",
    description: "Reserve your trip directly through Droelma.",
    icon: IconCalendarCheck,
  },
  {
    step: "4",
    title: "Experience",
    description: "Enjoy Bhutan with local expertise and support.",
    icon: IconMountainFlag,
  },
];

export default async function HomePage() {
  const [destinations, publishedItineraries, approvedGuides, articles] = await Promise.all([
    prisma.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, region: true, description: true, photoUrl: true },
    }),
    // Fetched once, in full — only a handful of packages exist — and reused
    // below both to count packages per destination and to rate/sort them,
    // rather than running a separate query per section.
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED" },
      include: { days: { orderBy: { dayNumber: "asc" }, include: { destination: true } } },
    }),
    prisma.guideProfile.findMany({
      where: { status: "APPROVED" },
      include: { user: true, destinations: { select: { name: true } } },
      orderBy: { yearsExperience: "desc" },
    }),
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
  ]);

  const packageIds = publishedItineraries.map((p) => p.id);
  const packageRatings = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetType: "ITINERARY", targetId: { in: packageIds } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const packageRatingById = new Map(packageRatings.map((r) => [r.targetId, r]));

  const sortedPackages = [...publishedItineraries].sort((a, b) => {
    const aRating = packageRatingById.get(a.id);
    const bRating = packageRatingById.get(b.id);
    const aScore = (aRating?._avg.rating ?? 0) * 1000 + (aRating?._count.rating ?? 0);
    const bScore = (bRating?._avg.rating ?? 0) * 1000 + (bRating?._count.rating ?? 0);
    return bScore - aScore || Number(a.pricePerPerson) - Number(b.pricePerPerson);
  });
  const trendingTreks = sortedPackages.filter((p) => p.category === "TREKKING").slice(0, 6);
  const featured = sortedPackages.slice(0, 6);

  const packageCountByDestination = new Map<string, number>();
  for (const p of publishedItineraries) {
    const destinationIds = uniqueOrdered(
      p.days.map((d) => d.destinationId).filter((id): id is string => Boolean(id))
    );
    for (const id of destinationIds) {
      packageCountByDestination.set(id, (packageCountByDestination.get(id) ?? 0) + 1);
    }
  }
  const featuredDestinations = destinations.slice(0, 8);

  const guideRatings = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetType: "GUIDE", targetId: { in: approvedGuides.map((g) => g.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const guideRatingById = new Map(guideRatings.map((r) => [r.targetId, r]));
  const featuredGuides = [...approvedGuides]
    .sort((a, b) => {
      const aRating = guideRatingById.get(a.id);
      const bRating = guideRatingById.get(b.id);
      const aScore = (aRating?._avg.rating ?? 0) * 1000 + (aRating?._count.rating ?? 0);
      const bScore = (bRating?._avg.rating ?? 0) * 1000 + (bRating?._count.rating ?? 0);
      return bScore - aScore || b.yearsExperience - a.yearsExperience;
    })
    .slice(0, 4);

  const testimonials = await getTestimonials();

  return (
    <div>
      <Hero destinations={destinations} />

      <section className="mt-14">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
          Start Planning Your Bhutan Trip
        </h2>
        <ScrollReveal className="mt-8 grid gap-6 sm:grid-cols-3">
          {quickActions.map((c) => (
            <MotionCard key={c.href} href={c.href} className="card block h-full">
              <c.icon className="h-8 w-8 text-brand-600" />
              <h3 className="mt-3 font-display text-lg font-semibold text-brand-800">{c.title}</h3>
              <p className="mt-2 text-sm text-stone-600">{c.description}</p>
            </MotionCard>
          ))}
        </ScrollReveal>
      </section>

      {trendingTreks.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">Trending Trekking Packages</h2>
            <Link href="/packages" className="text-sm text-brand-700 hover:underline">
              View All Treks →
            </Link>
          </div>
          <p className="mt-1 text-sm text-stone-600">Multi-day treks, guide and gear included.</p>
          <ScrollReveal className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {trendingTreks.map((p) => (
              <PackageItemCard key={p.id} itinerary={p} rating={packageRatingById.get(p.id)} />
            ))}
          </ScrollReveal>
        </section>
      )}

      {featured.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">Featured Tours &amp; Packages</h2>
            <Link href="/packages" className="text-sm text-brand-700 hover:underline">
              View All Tours →
            </Link>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            Ready-made itineraries, or{" "}
            <Link href="/custom-tour" className="text-brand-700 hover:underline">
              request a custom tour
            </Link>{" "}
            built around what you want to see.
          </p>
          <ScrollReveal className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((p) => (
              <PackageItemCard key={p.id} itinerary={p} rating={packageRatingById.get(p.id)} />
            ))}
          </ScrollReveal>
        </section>
      )}

      <section className="mt-20">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">Why Droelma</h2>
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

      <section className="mt-20">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-2xl font-semibold text-stone-900">Explore Bhutan</h2>
          <Link href="/destinations" className="text-sm text-brand-700 hover:underline">
            Explore All Destinations →
          </Link>
        </div>
        <p className="mt-1 text-sm text-stone-600">
          From the well-trodden west to the far east, visited by only a handful of travelers each year.
        </p>
        <ScrollReveal className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {featuredDestinations.map((d) => (
            <DestinationCard
              key={d.id}
              href={`/destinations/${d.slug}`}
              photoUrl={d.photoUrl}
              name={d.name}
              description={d.description}
              packageCount={packageCountByDestination.get(d.id) ?? 0}
            />
          ))}
        </ScrollReveal>
      </section>

      <section className="mt-20">
        <div className="rounded-2xl bg-gradient-to-br from-brand-900 to-brand-950 px-6 py-12 text-center text-white sm:px-12">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">
            Your Bhutan. <em className="text-gold-300 italic">Your Journey.</em>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">
            Tell us what you want to experience in Bhutan, and we&apos;ll help shape the journey around
            you.
          </p>
          <a
            href="/custom-tour"
            className="mt-6 inline-block rounded-full bg-gold-400 px-7 py-3 font-display text-base font-semibold text-brand-950 shadow-lg transition-transform hover:scale-[1.03] hover:bg-gold-300"
          >
            Build My Trip →
          </a>
        </div>
      </section>

      {featuredGuides.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">Local Guides</h2>
            <Link href="/guides" className="text-sm text-brand-700 hover:underline">
              Meet Our Guides →
            </Link>
          </div>
          <p className="mt-1 text-sm text-stone-600">
            TCB-licensed guides, approved by our team before they can take bookings.
          </p>
          <ScrollReveal className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featuredGuides.map((g) => {
              const rating = guideRatingById.get(g.id);
              return (
                <GuideCard
                  key={g.id}
                  href={`/guides/${g.id}`}
                  photoUrl={g.photoUrl}
                  name={g.user.name}
                  locations={g.destinations.map((d) => d.name)}
                  languages={g.languages}
                  yearsExperience={g.yearsExperience}
                  ratingAverage={rating?._avg.rating ?? null}
                  ratingCount={rating?._count.rating ?? 0}
                />
              );
            })}
          </ScrollReveal>
        </section>
      )}

      <section className="mt-20">
        <h2 className="text-center font-display text-2xl font-semibold text-stone-900">How Droelma Works</h2>
        <ScrollReveal className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {howItWorks.map((s) => (
            <div key={s.step} className="card text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-50 font-display text-lg font-semibold text-brand-700">
                {s.step}
              </span>
              <s.icon className="mx-auto mt-3 h-6 w-6 text-brand-600" />
              <h3 className="mt-2 font-display text-base font-semibold text-stone-900">{s.title}</h3>
              <p className="mt-1 text-sm text-stone-600">{s.description}</p>
            </div>
          ))}
        </ScrollReveal>
      </section>

      {testimonials.length > 0 && (
        <section className="mt-20">
          <h2 className="text-center font-display text-2xl font-semibold text-stone-900">
            What Our Travelers Say
          </h2>
          <div className="mt-8">
            <TestimonialCarousel testimonials={testimonials} />
          </div>
        </section>
      )}

      {articles.length > 0 && (
        <section className="mt-20">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold text-stone-900">From the Travel Guide</h2>
            <Link href="/travel-guide" className="text-sm text-brand-700 hover:underline">
              Browse the Travel Guide →
            </Link>
          </div>
          <ScrollReveal className="mt-6 grid gap-4 sm:grid-cols-3">
            {articles.map((a) => (
              <ArticleCard
                key={a.id}
                href={`/travel-guide/${a.slug}`}
                coverPhotoUrl={a.coverPhotoUrl}
                category={a.category}
                title={a.title}
                readMinutes={a.readMinutes}
              />
            ))}
          </ScrollReveal>
        </section>
      )}

      <AiPlannerTeaser />

      <section className="mt-20">
        <div className="rounded-2xl border border-stone-200 bg-white px-6 py-12 text-center sm:px-12">
          <h2 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
            Your Bhutan Journey Starts Here
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-stone-600 sm:text-base">
            Explore Bhutan, find your experience, and start planning your journey.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/packages" className="btn-primary">
              Explore Tours
            </Link>
            <Link href="/custom-tour" className="btn-secondary">
              Plan Your Trip
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function uniqueOrdered(values: string[]) {
  return Array.from(new Set(values));
}

type PackageWithDays = Itinerary & { days: (ItineraryDay & { destination: Destination | null })[] };

function PackageItemCard({
  itinerary,
  rating,
}: {
  itinerary: PackageWithDays;
  rating: { _avg: { rating: number | null }; _count: { rating: number } } | undefined;
}) {
  const locations = uniqueOrdered(
    itinerary.days.map((d) => d.destination?.name).filter((n): n is string => Boolean(n))
  );
  return (
    <PackageCard
      href={`/packages/${itinerary.slug}`}
      enquireHref={`/contact?subject=${encodeURIComponent(`Enquiry: ${itinerary.title}`)}`}
      imageUrl={itinerary.coverPhotoUrl}
      imageFallback={itinerary.title[0]}
      title={itinerary.title}
      subtitle={locations.join(" • ") || undefined}
      durationDays={itinerary.durationDays}
      ratingAverage={rating?._avg.rating ?? null}
      ratingCount={rating?._count.rating ?? 0}
      priceLabel={<Money btn={Number(itinerary.pricePerPerson)} />}
      priceSubLabel="per person"
    />
  );
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
  const itineraryIds = reviews.filter((r) => r.targetType === "ITINERARY").map((r) => r.targetId);

  const [guides, hotels, vehicles, itineraries] = await Promise.all([
    prisma.guideProfile.findMany({ where: { id: { in: guideIds } }, include: { user: true } }),
    prisma.hotel.findMany({ where: { id: { in: hotelIds } } }),
    prisma.vehicle.findMany({ where: { id: { in: vehicleIds } }, include: { operator: true } }),
    prisma.itinerary.findMany({ where: { id: { in: itineraryIds } } }),
  ]);

  const labelById = new Map<string, string>();
  for (const g of guides) labelById.set(g.id, `Traveled with guide ${g.user.name}`);
  for (const h of hotels) labelById.set(h.id, `Stayed at ${h.name}`);
  for (const v of vehicles) labelById.set(v.id, `Rode with ${v.operator.businessName}`);
  for (const it of itineraries) labelById.set(it.id, `Traveled on ${it.title}`);

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

function IconCheckCircle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 12.5l2.5 2.5L16 9.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCalendarCheck({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="4" y="5" width="16" height="15" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4 9.5h16M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8.5 14.5l2 2 4-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconMountainFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 19l7-12 4 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M11 19l4.5-8L22 19" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M15.5 11V4M15.5 4l4 1.5-4 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}
