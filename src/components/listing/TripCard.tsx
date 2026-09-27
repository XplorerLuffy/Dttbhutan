import { format } from "date-fns";
import type {
  Departure,
  Destination,
  Itinerary,
  ItineraryCategory,
  ItineraryDay,
  TripDifficulty,
} from "@prisma/client";
import Money from "@/components/Money";
import PackageCard, { type PackageCardMeta } from "./PackageCard";

export type TripCardItinerary = Itinerary & {
  days: (ItineraryDay & { destination: Destination | null })[];
  departures: Departure[];
};

export const CATEGORY_LABEL: Record<ItineraryCategory, string> = {
  TREKKING: "Trekking",
  CULTURAL: "Cultural",
  WILDLIFE: "Wildlife",
  HONEYMOON: "Honeymoon",
};

export const DIFFICULTY_LABEL: Record<TripDifficulty, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

/**
 * Maps a package to the presentational PackageCard. Lives here rather than in
 * each page so the homepage carousels and the "more trips" row on a trip page
 * can't drift apart — the card is the same thing in both places.
 *
 * `departures` is expected to already be narrowed to the joinable ones by the
 * caller's query (future, not cancelled or sold out); the first is shown as
 * the next departure.
 */
export default function TripCard({
  itinerary,
  rating,
}: {
  itinerary: TripCardItinerary;
  rating?: { _avg: { rating: number | null }; _count: { rating: number } };
}) {
  const locations = Array.from(
    new Set(itinerary.days.map((d) => d.destination?.name).filter((n): n is string => Boolean(n)))
  );
  const next = itinerary.departures[0];

  const meta: PackageCardMeta[] = [
    { label: "Activity level", value: DIFFICULTY_LABEL[itinerary.difficulty] },
  ];
  if (itinerary.maxGroupSize) {
    meta.push({ label: "Group size", value: `Max ${itinerary.maxGroupSize}` });
  }
  if (next) {
    meta.push({ label: "Next departure", value: formatDepartureDate(next.startDate) });
  }

  return (
    <PackageCard
      href={`/packages/${itinerary.slug}`}
      enquireHref={`/contact?subject=${encodeURIComponent(`Enquiry: ${itinerary.title}`)}`}
      imageUrl={itinerary.coverPhotoUrl}
      imageFallback={itinerary.title[0]}
      categoryLabel={CATEGORY_LABEL[itinerary.category]}
      title={itinerary.title}
      subtitle={locations.join(" • ") || itinerary.summary}
      durationDays={itinerary.durationDays}
      meta={meta}
      ratingAverage={rating?._avg.rating ?? null}
      ratingCount={rating?._count.rating ?? 0}
      priceLabel={<Money btn={Number(itinerary.pricePerPerson)} />}
    />
  );
}

/**
 * The column is a DATE, so read it back in UTC — a 4 October departure must
 * not render as the 3rd for a visitor west of Greenwich.
 */
export function formatDepartureDate(date: Date) {
  return format(new Date(`${date.toISOString().slice(0, 10)}T12:00:00`), "d MMM yyyy");
}
