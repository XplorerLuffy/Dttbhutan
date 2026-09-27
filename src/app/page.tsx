import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Hero from "@/components/home/Hero";
import ScrollReveal from "@/components/ScrollReveal";
import PackageCard from "@/components/listing/PackageCard";
import DestinationCard from "@/components/home/DestinationCard";
import ArticleCard from "@/components/ArticleCard";
import AiPlannerTeaser from "@/components/home/AiPlannerTeaser";
import SectionHeading from "@/components/home/SectionHeading";
import ValueBand from "@/components/home/ValueBand";
import GuideSpotlight, { type SpotlightGuide } from "@/components/home/GuideSpotlight";
import ResponsibleTravel from "@/components/home/ResponsibleTravel";
import QuoteCards from "@/components/home/QuoteCards";
import FeatureBanner from "@/components/home/FeatureBanner";
import Money from "@/components/Money";
import type { Testimonial } from "@/components/home/TestimonialCarousel";
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

  return (
    <div>
      <Hero destinations={destinations} />

      <div>
        <ValueBand
          packageCount={publishedItineraries.length}
          destinationCount={destinations.length}
          ratingAverage={overallRating._avg.rating}
          ratingCount={overallRating._count.rating}
        />
      </div>

      {featured.length > 0 && (
        <Container className="py-20 sm:py-24">
          <SectionHeading
            title="Journeys Worth the Flight"
            subtitle="Planned end to end, priced per person, and ready to book — or to use as the starting point for something of your own."
          />
          <ScrollReveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p) => (
              <PackageItemCard key={p.id} itinerary={p} rating={packageRatingById.get(p.id)} />
            ))}
          </ScrollReveal>
          <div className="mt-12 text-center">
            <Link
              href="/packages"
              className="inline-block rounded-full border border-stone-300 bg-white px-8 py-3.5 font-display text-base font-semibold text-stone-800 transition-colors hover:bg-stone-50"
            >
              See all tour packages
            </Link>
          </div>
        </Container>
      )}

      {featuredGuides.length > 0 && (
        <div className="bg-stone-100/70 py-20 sm:py-24">
          <Container>
            <SectionHeading
              title="The People You'll Travel With"
              subtitle="Bhutan requires every visitor to travel with a licensed guide. These are ours."
            />
            <ScrollReveal className="mt-14">
              <GuideSpotlight guides={featuredGuides} />
            </ScrollReveal>
            <div className="mt-12 text-center">
              <Link href="/guides" className="font-semibold text-brand-700 hover:underline">
                Meet all our guides →
              </Link>
            </div>
          </Container>
        </div>
      )}

      <Container className="py-20 sm:py-24">
        <ResponsibleTravel />
      </Container>

      {trendingTreks.length > 0 && (
        <Container className="pb-20 sm:pb-24">
          <SectionHeading
            title="Take the Long Way"
            subtitle="Multi-day treks through the high valleys, with guide, crew and gear arranged."
          />
          <ScrollReveal className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {trendingTreks.map((p) => (
              <PackageItemCard key={p.id} itinerary={p} rating={packageRatingById.get(p.id)} />
            ))}
          </ScrollReveal>
        </Container>
      )}

      <div className="bg-stone-100/70 py-20 sm:py-24">
        <Container>
          <SectionHeading
            title="Twenty Dzongkhags, One Country"
            subtitle="From the well-trodden west to the far east, visited by only a handful of travelers each year."
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
              Explore every destination →
            </Link>
          </div>
        </Container>
      </div>

      {testimonials.length > 0 && (
        <Container className="py-20 sm:py-24">
          <SectionHeading
            title="Our Travelers Say It Best"
            subtitle="Every review here is tied to a completed booking — we can't write them, and neither can anyone else."
          />
          <ScrollReveal className="mt-14">
            <QuoteCards testimonials={testimonials} />
          </ScrollReveal>
        </Container>
      )}

      <FeatureBanner />

      {articles.length > 0 && (
        <Container className="py-20 sm:py-24">
          <SectionHeading
            title="Before You Go"
            subtitle="Visas, the Sustainable Development Fee, and when the weather is actually on your side."
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
              Read the travel guide →
            </Link>
          </div>
        </Container>
      )}

      <Container className="pb-8">
        <AiPlannerTeaser />
      </Container>
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
