/**
 * The four numbers at the top of the traveler's dashboard, from their bookings.
 *
 *  - total:     every booking that has not been cancelled (a cancelled one is
 *               not a trip they took or will take);
 *  - upcoming:  confirmed and not yet over (a trip under way still counts);
 *               a booking still waiting for the agency's confirmation does not;
 *  - completed: marked completed, or confirmed and past its end date (nobody
 *               has to remember to flip the status for a finished trip);
 *  - saved:     trips the traveler saved. The site has no saving feature yet,
 *               so this is 0 until one exists and is passed in.
 */
export type BookingLike = { status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED"; endDate: Date };

export type TravelStats = { total: number; upcoming: number; completed: number; saved: number };

export function travelStats(bookings: BookingLike[], now: Date = new Date(), saved = 0): TravelStats {
  const live = bookings.filter((b) => b.status !== "CANCELLED");
  return {
    total: live.length,
    upcoming: live.filter((b) => b.status === "CONFIRMED" && b.endDate.getTime() >= now.getTime()).length,
    completed: live.filter(
      (b) => b.status === "COMPLETED" || (b.status === "CONFIRMED" && b.endDate.getTime() < now.getTime())
    ).length,
    saved,
  };
}
