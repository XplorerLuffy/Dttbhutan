import Link from "next/link";
import { notFound } from "next/navigation";
import { startOfToday } from "date-fns";
import { prisma } from "@/lib/prisma";
import ItineraryBookingForm from "@/components/booking/ItineraryBookingForm";
import DepartureList, { type DepartureView } from "@/components/booking/DepartureList";
import DetailGallery from "@/components/listing/DetailGallery";
import Money from "@/components/Money";
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

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

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
      departures: {
        where: { startDate: { gte: startOfToday() }, status: { not: "CANCELLED" } },
        orderBy: { startDate: "asc" },
      },
    },
  });
  if (!itinerary || itinerary.status !== "PUBLISHED") notFound();

  const departures: DepartureView[] = itinerary.departures.map((d) => ({
    id: d.id,
    startDate: d.startDate.toISOString().slice(0, 10),
    endDate: d.endDate.toISOString().slice(0, 10),
    price: Number(d.priceOverride ?? itinerary.pricePerPerson),
    status: d.status,
    note: d.note,
  }));

  return (
    <div>
      <DetailGallery photos={[itinerary.coverPhotoUrl]} label={itinerary.title} />

      <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{itinerary.title}</h1>
          <span className="badge bg-stone-100 text-stone-600">{DIFFICULTY_LABEL[itinerary.difficulty]}</span>
        </div>
        <p className="mt-1 text-stone-600">{itinerary.summary}</p>
        <p className="mt-2 text-sm text-stone-500">{itinerary.durationDays} days</p>

        {itinerary.description && <p className="mt-4 text-stone-700">{itinerary.description}</p>}

        <section id="dates" className="mt-10 scroll-mt-24">
          <h2 className="font-display text-xl font-semibold text-stone-900">Departure dates</h2>
          {departures.length > 0 ? (
            <>
              <p className="mt-1 text-sm text-stone-600">
                Pick a departure to request a place on it. Prices are per person.
              </p>
              <div className="mt-5">
                <DepartureList departures={departures} packageTitle={itinerary.title} />
              </div>
            </>
          ) : (
            <p className="mt-1 text-sm text-stone-600">
              No scheduled departures are published for this tour yet.{" "}
              <Link href="/custom-tour" className="text-brand-700 hover:underline">
                Tell us when you&apos;d like to travel
              </Link>{" "}
              and we&apos;ll arrange it around your dates.
            </p>
          )}
        </section>

        {(itinerary.includes.length > 0 || itinerary.excludes.length > 0) && (
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {itinerary.includes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-pine-800">Included</h3>
                <ul className="space-y-1 text-sm text-stone-600">
                  {itinerary.includes.map((i) => (
                    <li key={i}>✓ {i}</li>
                  ))}
                </ul>
              </div>
            )}
            {itinerary.excludes.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold text-stone-500">Not included</h3>
                <ul className="space-y-1 text-sm text-stone-600">
                  {itinerary.excludes.map((i) => (
                    <li key={i}>✗ {i}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">Day by day</h2>
          <ol className="space-y-4 border-l-2 border-stone-200 pl-5">
            {itinerary.days.map((day) => (
              <li key={day.id} className="relative">
                <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full bg-brand-700" />
                <p className="font-semibold">
                  Day {day.dayNumber}: {day.title}
                  {day.destination && (
                    <Link
                      href={`/destinations/${day.destination.slug}`}
                      className="ml-2 text-sm font-normal text-brand-700 hover:underline"
                    >
                      {day.destination.name}
                    </Link>
                  )}
                </p>
                {day.description && <p className="mt-1 text-sm text-stone-600">{day.description}</p>}
                {day.activities.length > 0 && (
                  <p className="mt-1 text-sm text-stone-500">{day.activities.join(" · ")}</p>
                )}
                {day.mealsIncluded.length > 0 && (
                  <p className="mt-1 text-xs text-stone-400">Meals: {day.mealsIncluded.join(", ")}</p>
                )}
              </li>
            ))}
          </ol>
        </div>
      </div>

      <div className="sticky-booking-card">
        <div className="price-summary-card">
          <p className="text-2xl font-bold text-brand-800">
            <Money btn={Number(itinerary.pricePerPerson)} />
          </p>
          <p className="text-sm text-stone-500">per person</p>
        </div>
        <ItineraryBookingForm itineraryId={itinerary.id} maxGroupSize={itinerary.maxGroupSize} />
      </div>
      </div>
    </div>
  );
}
