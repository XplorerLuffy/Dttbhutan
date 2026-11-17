/**
 * What a "Book Now" on a scheduled departure is worth and when it runs,
 * decided on the server from the departure itself — never from what the
 * browser says. The page shows a departure's own price (peak weeks can cost
 * more than the package's standard price) and its own dates, so the booking
 * must use the same ones.
 */
export type DepartureFacts = {
  itineraryId: string;
  startDate: Date;
  endDate: Date;
  priceOverride: number | null;
  status: "OPEN" | "LIMITED" | "SOLD_OUT" | "CANCELLED";
};

export type ItineraryFacts = { id: string; pricePerPerson: number; maxGroupSize: number | null };

export type DepartureBookingResult =
  | { ok: true; startDate: Date; endDate: Date; pricePerPerson: number }
  | { ok: false; error: string };

export function resolveDepartureBooking(
  departure: DepartureFacts,
  itinerary: ItineraryFacts,
  travelers: number,
  now: Date = new Date()
): DepartureBookingResult {
  if (departure.itineraryId !== itinerary.id) return { ok: false, error: "That date doesn't belong to this package." };
  if (departure.status === "SOLD_OUT") return { ok: false, error: "That departure is sold out. Try another date, or ask us about private dates." };
  if (departure.status === "CANCELLED") return { ok: false, error: "That departure has been cancelled." };

  // A DATE column arrives as midnight UTC; a departure is still bookable on its start day.
  const startOfToday = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  if (departure.startDate.getTime() < startOfToday) return { ok: false, error: "That departure has already started." };

  if (itinerary.maxGroupSize && travelers > itinerary.maxGroupSize) {
    return { ok: false, error: `This package allows at most ${itinerary.maxGroupSize} travelers per booking.` };
  }
  return {
    ok: true,
    startDate: departure.startDate,
    endDate: departure.endDate,
    pricePerPerson: departure.priceOverride ?? itinerary.pricePerPerson,
  };
}
