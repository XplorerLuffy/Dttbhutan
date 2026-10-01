import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * How much work is waiting, by the queue it is waiting in.
 *
 * One place, because two things need the same numbers and they must agree: the
 * sidebar badges, which are what tell an admin where to go from any page, and
 * the overview, which is where they land. Counted separately in each would be
 * two sets of filters to keep in step, and a badge that disagrees with the page
 * it points at is worse than no badge.
 *
 * Only ever counts things a person has to *do* something about. Totals —
 * how many packages exist, how many destinations — belong on their own pages;
 * a number that is never zero teaches people to ignore the badge.
 */
export type AdminWorkload = {
  vendors: number;
  bookings: number;
  customTours: number;
  enquiries: number;
  flaggedTrips: number;
  /** Everything above added up, so a caller can ask "is there anything?" */
  total: number;
};

export async function getAdminWorkload(): Promise<AdminWorkload> {
  const [guides, hotels, operators, bookings, customTours, enquiries, flaggedTrips] =
    await Promise.all([
      prisma.guideProfile.count({ where: { status: "PENDING" } }),
      prisma.hotel.count({ where: { status: "PENDING" } }),
      prisma.transportOperator.count({ where: { status: "PENDING" } }),
      prisma.booking.count({ where: { status: "PENDING" } }),
      prisma.customTourRequest.count({ where: { status: "NEW" } }),
      prisma.contactMessage.count({ where: { status: "NEW" } }),
      prisma.tripDistanceReport.count({ where: { flagged: true } }),
    ]);

  const counts = {
    vendors: guides + hotels + operators,
    bookings,
    customTours,
    enquiries,
    flaggedTrips,
  };

  return {
    ...counts,
    total: Object.values(counts).reduce((sum, n) => sum + n, 0),
  };
}
