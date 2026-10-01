import Link from "next/link";
import { startOfToday } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";
import Hero from "@/components/home/Hero";
import ScrollReveal from "@/components/ScrollReveal";
import TripCard from "@/components/listing/TripCard";
import DestinationCard from "@/components/home/DestinationCard";
import ArticleCard from "@/components/ArticleCard";
import AiPlannerTeaser from "@/components/home/AiPlannerTeaser";
import SectionHeading from "@/components/home/SectionHeading";
import ValueBand from "@/components/home/ValueBand";
import FeaturedCollections, { type Collection } from "@/components/home/FeaturedCollections";
import GuideSpotlight, { type SpotlightGuide } from "@/components/home/GuideSpotlight";
import ResponsibleTravel from "@/components/home/ResponsibleTravel";
import QuoteCards from "@/components/home/QuoteCards";
import FeatureBanner from "@/components/home/FeatureBanner";
import type { Testimonial } from "@/components/home/TestimonialCarousel";
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

/**
 * The homepage lays out its own width rather than sitting inside the shared
 * `max-w-6xl` container — see SiteChrome, which exempts "/" so the coloured
 * and media bands below can run edge to edge. Anything that shouldn't be
 * full-bleed goes inside <Container>.
 */
function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

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
      include: {
        days: { orderBy: { dayNumber: "asc" }, include: { destination: true } },
        // Only the next one, so a card can say when the trip actually runs.
        // Past and cancelled dates are filtered here for the same reason the
        // detail page filters them: they are not a departure anyone can join.
        departures: {
          where: { startDate: { gte: startOfToday() }, status: { notIn: ["CANCELLED", "SOLD_OUT"] } },
          orderBy: { startDate: "asc" },
          take: 1,
        },
      },
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
  const trendingTreks = sortedPackages.filter((p) => p.category === "TREKKING").slice(0, 4);
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
  const featuredGuides: SpotlightGuide[] = [...approvedGuides]
    .sort((a, b) => {
      const aRating = guideRatingById.get(a.id);
      const bRating = guideRatingById.get(b.id);
      const aScore = (aRating?._avg.rating ?? 0) * 1000 + (aRating?._count.rating ?? 0);
      const bScore = (bRating?._avg.rating ?? 0) * 1000 + (bRating?._count.rating ?? 0);
      return bScore - aScore || b.yearsExperience - a.yearsExperience;
    })
    .slice(0, 3)
    .map((g) => ({
      id: g.id,
      name: g.user.name,
      photoUrl: g.photoUrl,
      bio: g.bio,
      yearsExperience: g.yearsExperience,
      specialties: g.specialties,
      languages: g.languages,
      destinations: g.destinations.map((d) => d.name),
    }));

  // Headline rating for the stat strip: counted across every review rather
  // than a curated subset, so it can't be flattered by picking targets.
  const overallRating = await prisma.review.aggregate({ _avg: { rating: true }, _count: { rating: true } });

  const testimonials = (await getTestimonials()).slice(0, 3);
  const content = await getSiteContent();

  // Grouped from the packages already in memory rather than another query.
  // A category with nothing published is dropped, so no card can lead to an
  // empty result page.
  const collections: Collection[] = ["CULTURAL", "TREKKING", "WILDLIFE", "HONEYMOON"]
    .map((category) => {
      const inCategory = publishedItineraries.filter((p) => p.category === category);
      return {
        category,
        count: inCategory.length,
        fromPrice: Math.min(...inCategory.map((p) => Number(p.pricePerPerson))),
        photoUrl: inCategory.find((p) => p.coverPhotoUrl)?.coverPhotoUrl ?? null,
      };
    })
    .filter((c) => c.count > 0);

  return (
    <div>
      <Hero
        destinations={destinations}
        headline={content("home.hero.headline")}
        searchButton={content("home.hero.searchButton")}
        searchPrompt={content("home.hero.searchPrompt")}
        customPrefix={content("home.hero.customPrefix")}
        customLink={content("home.hero.customLink")}
        customHref={content("home.hero.customLinkHref")}
        customSuffix={content("home.hero.customSuffix")}
        videoUrl={content("home.hero.videoUrl")}
        posterUrl={content("home.hero.posterUrl")}
      />

      {collections.length > 0 && (
        <Container className="py-20 sm:py-24">
          <FeaturedCollections content={content} collections={collections} />
        </Container>
      )}

      <div>
        <ValueBand
          content={content}
          packageCount={publishedItineraries.length}
          destinationCount={destinations.length}
          ratingAverage={overallRating._avg.rating}
          ratingCount={overallRating._count.rating}
        />
      </div>

      {featured.length > 0 && (
        <Container className="py-20 sm:py-24">
          <SectionHeading
            title={content("home.packages.heading")}
            subtitle={content("home.packages.subtitle")}
          />
          <ScrollReveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <TripCard key={p.id} itinerary={p} rating={packageRatingById.get(p.id)} />
            ))}
          </ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/packages"
              className="inline-block rounded-full border border-stone-300 bg-white px-8 py-3.5 font-display text-base font-semibold text-stone-800 transition-colors hover:bg-stone-50"
            >
              {content("home.packages.cta")}
            </Link>
          </div>
        </Container>
      )}

      {featuredGuides.length > 0 && (
        <div className="bg-stone-100/70 py-20 sm:py-24">
          <Container>
            <SectionHeading
              title={content("home.guides.heading")}
              subtitle={content("home.guides.subtitle")}
            />
            <div className="mt-14">
              <GuideSpotlight guides={featuredGuides} />
            </div>
            <div className="mt-12 text-center">
              <Link href="/guides" className="font-semibold text-brand-700 hover:underline">
                {content("home.guides.cta")}
              </Link>
            </div>
          </Container>
        </div>
      )}

      <Container className="py-20 sm:py-24">
        <ResponsibleTravel content={content} />
      </Container>

      {trendingTreks.length > 0 && (
        <Container className="pb-20 sm:pb-24">
          <SectionHeading
            title={content("home.treks.heading")}
            subtitle={content("home.treks.subtitle")}
          />
          <ScrollReveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingTreks.map((p) => (
              <TripCard key={p.id} itinerary={p} rating={packageRatingById.get(p.id)} />
            ))}
          </ScrollReveal>
        </Container>
      )}

      <div className="bg-stone-100/70 py-20 sm:py-24">
        <Container>
          <SectionHeading
            title={content("home.destinations.heading")}
            subtitle={content("home.destinations.subtitle")}
          />
          <ScrollReveal className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
          <div className="mt-12 text-center">
            <Link href="/destinations" className="font-semibold text-brand-700 hover:underline">
              {content("home.destinations.cta")}
            </Link>
          </div>
        </Container>
      </div>

      {testimonials.length > 0 && (
        <Container className="py-20 sm:py-24">
          <SectionHeading
            title={content("home.testimonials.heading")}
            subtitle={content("home.testimonials.subtitle")}
          />
          <div className="mt-14">
            <QuoteCards testimonials={testimonials} />
          </div>
        </Container>
      )}

      <FeatureBanner
        heading={content("home.banner.heading")}
        subtitle={content("home.banner.subtitle")}
        cta={content("home.banner.cta")}
        ctaHref={content("home.banner.ctaHref")}
      />

      {articles.length > 0 && (
        <Container className="py-20 sm:py-24">
          <SectionHeading
            title={content("home.articles.heading")}
            subtitle={content("home.articles.subtitle")}
          />
          <ScrollReveal className="mt-14 grid gap-6 sm:grid-cols-3">
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
          <div className="mt-12 text-center">
            <Link href="/travel-guide" className="font-semibold text-brand-700 hover:underline">
              {content("home.articles.cta")}
            </Link>
          </div>
        </Container>
      )}

      <Container className="pb-8">
        <AiPlannerTeaser
          heading={content("home.planner.heading")}
          body={content("home.planner.body")}
          cta={content("home.planner.cta")}
          ctaHref={content("home.planner.ctaHref")}
        />
      </Container>
    </div>
  );
}

function uniqueOrdered(values: string[]) {
  return Array.from(new Set(values));
}

async function getTestimonials(): Promise<Testimonial[]> {
  const candidates = await prisma.review.findMany({
    where: { comment: { not: null } },
    orderBy: { createdAt: "desc" },
    take: 30,
    include: { traveler: true },
  });

  // One quote per traveler, and never the same wording twice. A frequent
  // reviewer would otherwise fill all three cards, and a traveler who left
  // near-identical comments on their guide and their package would have both
  // shown side by side — which reads as invented rather than verified.
  const seenTravelers = new Set<string>();
  const seenComments = new Set<string>();
  const reviews = candidates.filter((r) => {
    const fingerprint = (r.comment ?? "").trim().toLowerCase();
    if (seenTravelers.has(r.travelerId) || seenComments.has(fingerprint)) return false;
    seenTravelers.add(r.travelerId);
    seenComments.add(fingerprint);
    return true;
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
