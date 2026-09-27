import Link from "next/link";
import { notFound } from "next/navigation";
import { startOfToday } from "date-fns";
import { prisma } from "@/lib/prisma";
import DepartureList, { type DepartureView } from "@/components/booking/DepartureList";
import TripPageHeader from "@/components/listing/TripPageHeader";
import TripRouteMap from "@/components/listing/TripRouteMapClient";
import type { RouteStop } from "@/components/listing/TripRouteMap";
import TripViewSwitch from "@/components/listing/TripViewSwitch";
import type { TripSubNavSection } from "@/components/listing/TripSubNav";
import TripGallery, { type GalleryPhoto } from "@/components/listing/TripGallery";
import ItineraryAccordion, {
  type ItineraryDayView,
} from "@/components/listing/ItineraryAccordion";
import TripReviews, { type TripReview } from "@/components/listing/TripReviews";
import TripCard, { CATEGORY_LABEL } from "@/components/listing/TripCard";
import TripLodging, { type LodgingView } from "@/components/listing/TripLodging";
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
      days: {
        orderBy: { dayNumber: "asc" },
        include: { destination: true, lodging: true },
      },
      lodgings: { orderBy: { position: "asc" } },
      photos: { orderBy: { position: "asc" } },
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

  const days: ItineraryDayView[] = itinerary.days.map((d) => {
    const hasHike =
      d.hikeDistanceKm !== null ||
      d.hikeAscentM !== null ||
      d.hikeDescentM !== null ||
      d.hikeHours !== null ||
      d.hikeNote !== null;

    return {
      id: d.id,
      dayNumber: d.dayNumber,
      title: d.title,
      description: d.description,
      destination: d.destination ? { name: d.destination.name, slug: d.destination.slug } : null,
      activities: d.activities,
      mealsIncluded: d.mealsIncluded,
      lodgingName: d.lodging?.name ?? null,
      hike: hasHike
        ? {
            distanceKm: d.hikeDistanceKm === null ? null : Number(d.hikeDistanceKm),
            ascentM: d.hikeAscentM,
            descentM: d.hikeDescentM,
            hours: d.hikeHours === null ? null : Number(d.hikeHours),
            // Only worth showing when the day differs from the trip's own
            // rating — repeating "Moderate" on every day of a moderate trip
            // is noise.
            difficulty:
              d.hikeDifficulty && d.hikeDifficulty !== itinerary.difficulty
                ? d.hikeDifficulty
                : null,
            note: d.hikeNote,
          }
        : null,
    };
  });

  // Nights per property are counted from the days that use it, so the two
  // can never disagree — see the ItineraryLodging model.
  const nightsByLodging = new Map<string, number>();
  for (const d of itinerary.days) {
    if (d.lodgingId) nightsByLodging.set(d.lodgingId, (nightsByLodging.get(d.lodgingId) ?? 0) + 1);
  }
  const lodgings: LodgingView[] = itinerary.lodgings.map((l) => ({
    id: l.id,
    name: l.name,
    location: l.location,
    description: l.description,
    photoUrl: l.photoUrl,
    nights: nightsByLodging.get(l.id) ?? 0,
  }));

  const photos: GalleryPhoto[] = itinerary.photos.map((p) => ({
    id: p.id,
    url: p.url,
    caption: p.caption,
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

  // The sub-nav shows a range when departures are priced differently, the
  // way an outfitter's does — a single "from" price is a half-truth once a
  // festival departure costs more.
  const departurePrices = departures.map((d) => d.price);
  const basePrice = Number(itinerary.pricePerPerson);
  const priceLow = departurePrices.length > 0 ? Math.min(...departurePrices) : basePrice;
  const priceHigh = departurePrices.length > 0 ? Math.max(...departurePrices) : basePrice;

  // The route, in the order the trip visits it: consecutive days in the same
  // place collapse into one stop, so a three-night base reads as one pin with
  // three days rather than three pins on top of each other.
  const stops: RouteStop[] = [];
  for (const d of itinerary.days) {
    const dest = d.destination;
    if (!dest || dest.latitude === null || dest.longitude === null) continue;
    const last = stops[stops.length - 1];
    if (last && last.name === dest.name) last.days.push(d.dayNumber);
    else
      stops.push({
        name: dest.name,
        latitude: dest.latitude,
        longitude: dest.longitude,
        days: [d.dayNumber],
      });
  }
  const startPlace = stops[0]?.name;
  const endPlace = stops[stops.length - 1]?.name;
  // Highlights come from the day activities rather than a field of their own:
  // they are already the "what you'll actually do" list, and one authored in
  // a separate box would drift out of step with the itinerary below it.
  const highlights = Array.from(new Set(itinerary.days.flatMap((d) => d.activities))).slice(0, 6);
  const hasIncludes = itinerary.includes.length > 0 || itinerary.excludes.length > 0;

  const departureMonths = summariseDepartureMonths(itinerary.departures.map((d) => d.startDate));

  // Only sections that actually render get a tab. Dates are deliberately
  // absent: they are the other view of this page, reached by the button, not
  // somewhere to scroll to. "What's included" sits inside the itinerary view
  // rather than earning a tab of its own.
  const sections: TripSubNavSection[] = [
    { id: "itinerary", label: "Itinerary" },
    ...(lodgings.length > 0 ? [{ id: "hotels", label: "Hotels" }] : []),
    ...(photos.length > 0 ? [{ id: "gallery", label: "Gallery" }] : []),
    ...(hasReviews ? [{ id: "reviews", label: "Reviews" }] : []),
  ];

  const datesPanel = (
    <section id="dates" className="scroll-mt-24 pt-8">
      <h2 className="font-display text-2xl font-bold text-stone-900">Dates &amp; Prices</h2>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_320px] lg:items-start">
        {/* DepartureList owns the empty case too: a trip with no
            scheduled dates still runs privately, and that tab is the
            answer to "when can I go" — hiding it behind a paragraph
            loses the enquiry. */}
        <div>
          <DepartureList departures={departures} packageTitle={itinerary.title} />
        </div>

        {/* No booking form here: every date row already carries its own
            "Request to Book", and a second form asking for the same
            thing in different words is how a page ends up with two
            answers to "how do I book this". */}
        <aside className="space-y-4 lg:sticky lg:top-24">
          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <MapCardIcon />
            <h3 className="mt-3 font-display text-base font-semibold text-stone-900">
              Want to learn more about this trip?
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Download the full itinerary — every day described, where you stay, what&apos;s
              included and the dates it runs. Easy to share with whoever you&apos;re travelling
              with.
            </p>
            <a
              href={`/packages/${itinerary.slug}/itinerary.pdf`}
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              Download &amp; share (PDF)
            </a>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-6">
            <ShieldIcon />
            <h3 className="mt-3 font-display text-base font-semibold text-stone-900">
              Book with confidence
            </h3>
            <p className="mt-2 text-sm text-stone-600">
              Requesting a place costs nothing and commits you to nothing. We confirm the
              departure, the hotels and the final price in writing before you pay anything.
            </p>
            <Link
              href="/cancellation"
              className="mt-3 inline-block text-sm font-semibold text-brand-700 hover:underline"
            >
              Cancellation &amp; refunds
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );

  return (
    <div>
      <TripPageHeader
        title={itinerary.title}
        categoryLabel={CATEGORY_LABEL[itinerary.category]}
        categoryHref={`/packages?category=${itinerary.category}`}
        imageUrl={itinerary.coverPhotoUrl}
        stats={{
          durationDays: itinerary.durationDays,
          difficulty: itinerary.difficulty,
          maxGroupSize: itinerary.maxGroupSize,
          departureMonths,
        }}
        ratingAverage={reviewAverage}
        ratingCount={reviewCount}
      />

      {/* The sub-nav shares this container with the sections below it: a
          sticky element only sticks within its own parent's box, so wrapping
          it in a container of its own would pin it to a 60px-tall nothing. */}
      <Container className={`mt-10 ${moreTrips.length > 0 ? "" : "pb-16"}`}>
        <TripViewSwitch
          sections={sections}
          price={
            priceHigh > priceLow ? (
              <>
                <Money btn={priceLow} /> – <Money btn={priceHigh} />
              </>
            ) : (
              <Money btn={priceLow} />
            )
          }
          priceNote="Includes guide, transport, hotels and the daily SDF"
          datesPanel={datesPanel}
        >

        <section id="itinerary" className="scroll-mt-24 pt-8">
          <h2 className="font-display text-3xl font-bold text-stone-900">{itinerary.title}</h2>
          <p className="mt-4 max-w-4xl text-lg leading-relaxed text-stone-700">
            {itinerary.summary}
          </p>
          {itinerary.description && (
            <p className="mt-4 max-w-4xl leading-relaxed text-stone-700">
              {itinerary.description}
            </p>
          )}

          <a
            href={`/packages/${itinerary.slug}/itinerary.pdf`}
            className="mt-8 inline-block rounded-full border-2 border-brand-800 px-7 py-3 font-display font-semibold text-brand-900 transition-colors hover:bg-brand-50"
          >
            Download Itinerary
          </a>

          {/* Without highlights the map takes the whole width rather than
              sitting in a column with nothing beside it. */}
          <div
            className={`mt-10 grid gap-10 border-t border-stone-200 pt-10 ${
              highlights.length > 0 ? "lg:grid-cols-[1fr_1.4fr]" : ""
            }`}
          >
            {highlights.length > 0 && (
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-900">
                  Highlights
                </h3>
                <ul className="mt-4 space-y-3">
                  {highlights.map((h) => (
                    <li key={h} className="flex gap-3 text-stone-700">
                      <span
                        aria-hidden
                        className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gold-500"
                      />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <div className="mb-4 space-y-1.5 text-stone-800">
                <p className="flex items-center gap-2 font-display text-lg font-semibold">
                  <PinIcon />
                  Bhutan
                </p>
                {startPlace && (
                  <p className="text-sm">
                    <span className="font-semibold">Start / end </span>
                    {startPlace === endPlace ? startPlace : `${startPlace} to ${endPlace}`}
                  </p>
                )}
              </div>
              {stops.length > 0 ? (
                <TripRouteMap stops={stops} />
              ) : (
                <p className="text-sm text-stone-500">
                  The route map appears once this trip&apos;s days are linked to destinations.
                </p>
              )}
            </div>
          </div>
        </section>

        {days.length > 0 && (
          <section id="days" className="mt-14 scroll-mt-24">
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

        {lodgings.length > 0 && (
          <section id="hotels" className="mt-14 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold text-stone-900">
              Where you&apos;ll stay
            </h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              The properties booked for this trip. Occasionally one is swapped for an equivalent
              when a departure fills — your confirmation lists the final list.
            </p>
            <div className="mt-6">
              <TripLodging lodgings={lodgings} />
            </div>
          </section>
        )}

        {photos.length > 0 && (
          <section id="gallery" className="mt-14 scroll-mt-24">
            <h2 className="font-display text-2xl font-bold text-stone-900">Gallery</h2>
            <p className="mt-2 max-w-2xl text-stone-600">
              Photographs from this trip. Tap any of them to see it full size.
            </p>
            <div className="mt-6">
              <TripGallery photos={photos} />
            </div>
          </section>
        )}

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
        </TripViewSwitch>
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

function PinIcon() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-5 w-5 text-brand-700"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.6" />
    </svg>
  );
}

const CARD_ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function MapCardIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-8 w-8 text-brand-800" {...CARD_ICON}>
      <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20Z" />
      <path d="M9 4v13.5M15 6.5V20" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-8 w-8 text-brand-800" {...CARD_ICON}>
      <path d="M12 3.5 20 6v6c0 4.6-3.3 7.8-8 9.5-4.7-1.7-8-4.9-8-9.5V6Z" />
      <path d="m8.8 12 2.3 2.3 4.1-4.6" />
    </svg>
  );
}

const MONTH_ABBR = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

/**
 * "2026: Oct · 2027: Feb–Apr, Oct" — the season at a glance, for the page
 * header.
 *
 * Runs of consecutive months collapse into a range, which is how a season
 * actually reads: a trip running February, March and April is a spring trip,
 * not three separate facts. Dates are read in UTC because the column is a
 * DATE, so a 1 March departure can't slip back into February for a visitor
 * west of Greenwich.
 */
function summariseDepartureMonths(dates: Date[]): string {
  if (dates.length === 0) return "";

  const byYear = new Map<string, Set<number>>();
  for (const date of dates) {
    const iso = date.toISOString();
    const year = iso.slice(0, 4);
    const month = Number(iso.slice(5, 7)) - 1;
    if (!byYear.has(year)) byYear.set(year, new Set());
    byYear.get(year)!.add(month);
  }

  return Array.from(byYear.keys())
    .sort()
    .map((year) => {
      const months = Array.from(byYear.get(year)!).sort((a, b) => a - b);
      const runs: string[] = [];
      let runStart = months[0];
      let previous = months[0];
      for (const month of months.slice(1)) {
        if (month === previous + 1) {
          previous = month;
          continue;
        }
        runs.push(formatRun(runStart, previous));
        runStart = month;
        previous = month;
      }
      runs.push(formatRun(runStart, previous));
      return `${year}: ${runs.join(", ")}`;
    })
    .join(" · ");
}

function formatRun(from: number, to: number) {
  return from === to ? MONTH_ABBR[from] : `${MONTH_ABBR[from]}\u2013${MONTH_ABBR[to]}`;
}
