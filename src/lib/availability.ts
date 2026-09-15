import "server-only";
import { prisma } from "@/lib/prisma";
import { BookingStatus } from "@prisma/client";

// Bookings in either of these states hold the slot; only cancelled bookings
// free it back up.
const BLOCKING_STATUSES: BookingStatus[] = [
  BookingStatus.PENDING,
  BookingStatus.CONFIRMED,
  BookingStatus.COMPLETED,
];

/** Two [start, end) date ranges overlap. */
function overlaps(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return aStart < bEnd && aEnd > bStart;
}

export async function isGuideAvailable(
  guideId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const [conflictingBooking, blockedDate] = await Promise.all([
    prisma.booking.findFirst({
      where: {
        guideId,
        status: { in: BLOCKING_STATUSES },
        startDate: { lt: endDate },
        endDate: { gt: startDate },
      },
      select: { id: true },
    }),
    prisma.guideBlockedDate.findFirst({
      where: {
        guideId,
        date: { gte: startDate, lt: endDate },
      },
      select: { id: true },
    }),
  ]);

  return !conflictingBooking && !blockedDate;
}

export async function isVehicleAvailable(
  vehicleId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
    where: {
      vehicleId,
      status: { in: BLOCKING_STATUSES },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
    select: { id: true },
  });
  return !conflict;
}

/** Number of rooms of this type still free for the given date range. */
export async function availableRoomCount(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<number> {
  const roomType = await prisma.roomType.findUniqueOrThrow({
    where: { id: roomTypeId },
    select: { totalRooms: true },
  });

  const overlappingBookings = await prisma.booking.count({
    where: {
      roomTypeId,
      status: { in: BLOCKING_STATUSES },
      startDate: { lt: endDate },
      endDate: { gt: startDate },
    },
  });

  return Math.max(0, roomType.totalRooms - overlappingBookings);
}

export async function isRoomTypeAvailable(
  roomTypeId: string,
  startDate: Date,
  endDate: Date
): Promise<boolean> {
  return (await availableRoomCount(roomTypeId, startDate, endDate)) > 0;
}

export { overlaps };
