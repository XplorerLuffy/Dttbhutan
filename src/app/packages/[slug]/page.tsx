import Link from "next/link";
import { notFound } from "next/navigation";
import { startOfToday } from "date-fns";
import { prisma } from "@/lib/prisma";
import ItineraryBookingForm from "@/components/booking/ItineraryBookingForm";
import DepartureList, { type DepartureView } from "@/components/booking/DepartureList";
import TripHero from "@/components/listing/TripHero";
import TripSubNav, { type TripSubNavSection } from "@/components/listing/TripSubNav";
import ActivityLevel from "@/components/listing/ActivityLevel";
import ItineraryAccordion, {
  type ItineraryDayView,
} from "@/components/listing/ItineraryAccordion";
import TripReviews, { type TripReview } from "@/components/listing/TripReviews";
import TripCard, { CATEGORY_LABEL } from "@/components/listing/TripCard";
import Money from "@/components/Money";
import type { DepartureStatus } from "@prisma/client";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const itinerary = await prisma.itinerary.findUnique({ where: { slug } });
  if (!itinerary || itinerary.status !== "PUBLISHED") return { title: "Package not found" };

  const description = `${itinerary.durationDays}-day Bhutan tour. ${itinerary.summary}`.slice(0, 160);

  return {
    title: itinerary.title,
    description,
    alternates: { canonical: `/packages/${itinerary.slug}` },
    openGraph: {
      title: itinerary.title,
      description,
      url: `/packages/${itinerary.slug}`,
      ...(itinerary.coverPhotoUrl ? { images: [itinerary.coverPhotoUrl] } : {}),
    },
  };
}

/** Departures a traveller could still join — reused for this trip and the related ones. */
function joinableDepartures(excludeSoldOut = false) {
  const notIn: DepartureStatus[] = excludeSoldOut ? ["CANCELLED", "SOLD_OUT"] : ["CANCELLED"];
  return {
    where: { startDate: { gte: startOfToday() }, status: { notIn } },
    orderBy: { startDate: "asc" as const },
  };
}

export default async function PackageDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const itinerary = await prisma.itinerary.findUnique({
    where: { slug },
    include: {
      days: { orderBy: { dayNumber: "asc" }, include: { destination: true } },
      // Past departures are dropped here rather than in the component: a
      // date that has already gone is not a choice, and showing it only
      // invites "why can't I book this".
      departures: joinableDepartures(),
    },
  });
  if (!itinerary || itinerary.status !== "PUBLISHED") notFound();

  const [reviewRows, reviewStats, related] = await Promise.all([
    prisma.review.findMany({
      where: { targetType: "ITINERARY", targetId: itinerary.id, comment: { not: null } },
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { traveler: { select: { name: true } } },
    }),
    prisma.review.aggregate({
      where: { targetType: "ITINERARY", targetId: itinerary.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED", id: { not: itinerary.id } },
      orderBy: { pricePerPerson: "asc" },
      include: {
        days: { orderBy: { dayNumber: "asc" }, include: { destination: true } },
        departures: { ...joinableDepartures(true), take: 1 },
      },
      take: 24,
    }),
  ]);

  // Same category first, so "more trips" reads as a shortlist rather than
  // whatever happened to be published next.
  const moreTrips = [
    ...related.filter((r) => r.category === itinerary.category),
    ...related.filter((r) => r.category !== itinerary.category),
  ].slice(0, 3);

  const departures: DepartureView[] = itinerary.departures.map((d) => ({
    id: d.id,
    startDate: d.startDate.toISOString().slice(0, 10),
    endDate: d.endDate.toISOString().slice(0, 10),
    price: Number(d.priceOverride ?? itinerary.pricePerPerson),
    status: d.status,
    note: d.note,
  }));

  const days: ItineraryDayView[] = itinerary.days.map((d) => ({
    id: d.id,
    dayNumber: d.dayNumber,
    title: d.title,
    description: d.description,
    destination: d.destination ? { name: d.destination.name, slug: d.destination.slug } : null,
    activities: d.activities,
    mealsIncluded: d.mealsIncluded,
  }));

  const reviews: TripReview[] = reviewRows.map((r) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.createdAt,
    travelerName: r.traveler.name,
  }));
  const reviewAverage = reviewStats._avg.rating;
  const reviewCount = reviewStats._count.rating;
  const hasReviews = reviews.length > 0 && reviewAverage !== null;

  const places = Array.from(
    new Set(itinerary.days.map((d) => d.destination?.name).filter((n): n is string => Boolean(n)))
  );
  // Highlights come from the day activities rather than a field of their own:
  // they are already the "what you'll actually do" list, and one authored in
  // a separate box would drift out of step with the itinerary below it.
  const highlights = Array.from(new Set(itinerary.days.flatMap((d) => d.activities))).slice(0, 6);
  const hasIncludes = itinerary.includes.length > 0 || itinerary.excludes.length > 0;

  // Only sections that actually render get a tab — see TripSubNav.
  const sections: TripSubNavSection[] = [
    { id: "overview", label: "Overview" },
    ...(days.length > 0 ? [{ id: "itinerary", label: "Itinerary" }] : []),
    { id: "dates", label: "Dates & Prices" },
    ...(hasIncludes ? [{ id: "included", label: "What's included" }] : []),
    ...(hasReviews ? [{ id: "reviews", label: "Reviews" }] : []),
  ];

  return (
    <div>
      <TripHero
        title={itinerary.title}
        summary={itinerary.summary}
        categoryLabel={CATEGORY_LABEL[itinerary.category]}
        imageUrl={itinerary.coverPhotoUrl}
        durationDays={itinerary.durationDays}
        difficulty={itinerary.difficulty}
        maxGroupSize={itinerary.maxGroupSize}
        price={<Money btn={Number(itinerary.pricePerPerson)} />}
      />

      {/* The sub-nav shares this container with the sections below it: a
          sticky element only sticks within its own parent's box, so wrapping
          it in a container of its own would pin it to a 60px-tall nothing. */}
      <Container className={`mt-10 ${moreTrips.length > 0 ? "" : "pb-16"}`}>
        <TripSubNav
          sections={sections}
          price={<Money btn={Number(itinerary.pricePerPerson)} />}
          datesId="dates"
        />

        <section id="overview" className="scroll-mt-24 pt-6">
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            <div>
              <h2 className="font-display text-2xl font-bold text-stone-900">Trip overview</h2>
              <p className="mt-3 text-lg leading-relaxed text-stone-700">{itinerary.summary}</p>
              {itinerary.description && (
                <p className="mt-4 leading-relaxed text-stone-700">{itinerary.description}</p>
              )}

              {highlights.length > 0 && (
                <div className="mt-8">
                  <h3 className="font-display text-lg font-semibold text-stone-900">
                    Trip highlights
                  </h3>
                  <ul className="mt-3 grid gap-x-8 gap-y-2 sm:grid-cols-2">
                    {highlights.map((h) => (
                      <li key={h} className="flex gap-2.5 text-stone-700">
                        <span aria-hidden className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500" />
                        {h}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <aside className="h-fit rounded-xl border border-stone-200 bg-white p-6">
              <h3 className="mb-4 font-display text-lg font-semibold text-stone-900">
                At a glance
              </h3>
              <dl className="space-y-4 text-sm">
                <Detail label="Trip length">
                  {itinerary.durationDays} days
                  {itinerary.durationDays > 1 && ` / ${itinerary.durationDays - 1} nights`}
                </Detail>
                <Detail label="Activity level">
                  <ActivityLevel difficulty={itinerary.difficulty} showBlurb />
                </Detail>
                <Detail label="Group size">
                  {itinerary.maxGroupSize ? `Up to ${itinerary.maxGroupSize} travellers` : "Small group"}
                </Detail>
                {places.length > 0 && <Detail label="Where you go">{places.join(" • ")}</Detail>}
                <Detail label="Departures">
                  {departures.length > 0
                    ? `${departures.length} scheduled date${departures.length === 1 ? "" : "s"}`
                    : "Private dates on request"}
                </Detail>
              </dl>
              <a
                href="#dates"
                className="mt-6 block rounded-full bg-brand-700 px-5 py-3 text-center font-semibold text-white transition-colors hover:bg-brand-800"
              >
                See dates &amp; prices
              </a>
            </aside>
          </div>
        </section>

        {days.length > 0 && (
          <section id="itinerary" className="mt-14 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold text-stone-900">Day by day</h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              What each day looks like. Timings shift with the weather and the festival calendar —
              your guide will tell you the night before.
            </p>
            <div className="mt-6">
              <ItineraryAccordion days={days} />
            </div>
          </section>
        )}

        <section id="dates" className="mt-14 scroll-mt-24">
          <h2 className="font-display text-2xl font-bold text-stone-900">Dates &amp; prices</h2>
          <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
            <div>
              {departures.length > 0 ? (
                <>
                  <p className="text-stone-600">
                    Pick a departure to request a place on it. Prices are per person.
                  </p>
                  <div className="mt-5">
                    <DepartureList departures={departures} packageTitle={itinerary.title} />
                  </div>
                </>
              ) : (
                <p className="text-stone-600">
                  No scheduled departures are published for this tour yet.{" "}
                  <Link href="/custom-tour" className="text-brand-700 hover:underline">
                    Tell us when you&apos;d like to travel
                  </Link>{" "}
                  and we&apos;ll arrange it around your dates.
                </p>
              )}
            </div>

            <aside className="rounded-xl border border-stone-200 bg-white p-6 lg:sticky lg:top-24">
              <p className="font-display text-2xl font-bold text-brand-800">
                <Money btn={Number(itinerary.pricePerPerson)} />
              </p>
              <p className="mb-4 text-sm text-stone-500">per person</p>
              <ItineraryBookingForm
                itineraryId={itinerary.id}
                maxGroupSize={itinerary.maxGroupSize}
              />
            </aside>
          </div>
        </section>

        {hasIncludes && (
          <section id="included" className="mt-14 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold text-stone-900">What&apos;s included</h2>
            <div className="mt-6 grid gap-6 sm:grid-cols-2">
              {itinerary.includes.length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-white p-6">
                  <h3 className="mb-3 font-display text-base font-semibold text-pine-800">
                    Included in the price
                  </h3>
                  <ul className="space-y-2 text-stone-700">
                    {itinerary.includes.map((i) => (
                      <li key={i} className="flex gap-2.5">
                        <span aria-hidden className="font-bold text-pine-600">
                          ✓
                        </span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {itinerary.excludes.length > 0 && (
                <div className="rounded-xl border border-stone-200 bg-stone-50 p-6">
                  <h3 className="mb-3 font-display text-base font-semibold text-stone-600">
                    Not included
                  </h3>
                  <ul className="space-y-2 text-stone-600">
                    {itinerary.excludes.map((i) => (
                      <li key={i} className="flex gap-2.5">
                        <span aria-hidden className="font-bold text-stone-400">
                          ✗
                        </span>
                        {i}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {reviews.length > 0 && reviewAverage !== null && (
          <section id="reviews" className="mt-14 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold text-stone-900">Traveler reviews</h2>
            <div className="mt-6">
              <TripReviews reviews={reviews} average={reviewAverage} total={reviewCount} />
            </div>
          </section>
        )}
      </Container>

      {moreTrips.length > 0 && (
        <div className="mt-16 bg-stone-100/70 py-14">
          <Container>
            <h2 className="font-display text-2xl font-bold text-stone-900">More trips for you</h2>
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moreTrips.map((trip) => (
                <TripCard key={trip.id} itinerary={trip} />
              ))}
            </div>
            <div className="mt-10 text-center">
              <Link
                href="/packages"
                className="inline-block rounded-full border border-stone-300 bg-white px-8 py-3.5 font-display font-semibold text-stone-800 transition-colors hover:bg-stone-50"
              >
                Browse all tours
              </Link>
            </div>
          </Container>
        </div>
      )}
    </div>
  );
}

/**
 * The trip pages lay out their own width (SiteChrome exempts /packages/*) so
 * the hero and the closing band can run edge to edge.
 */
function Container({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mx-auto max-w-6xl px-4 sm:px-6 ${className}`}>{children}</div>;
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">{label}</dt>
      <dd className="mt-1 text-stone-800">{children}</dd>
    </div>
  );
}
