import "server-only";
import { prisma } from "@/lib/prisma";
import {
  isGuideAvailable,
  isRoomTypeAvailable,
  isVehicleAvailable,
} from "@/lib/availability";
import { bookFlight } from "@/lib/flights/aggregator";
import type { z } from "zod";
import type { bookingSchema } from "@/lib/validation";

export type BookingInput = z.infer<typeof bookingSchema>;

export class BookingConflictError extends Error {}
export class BookingNotFoundError extends Error {}

export function nightsOrDays(startDate: Date, endDate: Date) {
  const ms = endDate.getTime() - startDate.getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)));
}

/**
 * Validates availability and creates a booking, atomically. For vehicle
 * bookings, also creates the linked Trip row that the GPS pipeline will
 * populate once the trip starts — this is the booking-to-device mapping
 * the mileage verification module depends on (via Vehicle -> GpsDevice).
 */
export async function createBooking(travelerId: string, input: BookingInput) {
  if (input.type === "ITINERARY") {
    const itinerary = await prisma.itinerary.findUnique({ where: { id: input.itineraryId } });
    if (!itinerary || itinerary.status !== "PUBLISHED") {
      throw new BookingNotFoundError("Package not found");
    }
    if (itinerary.maxGroupSize && input.travelers > itinerary.maxGroupSize) {
      throw new BookingConflictError(`This package allows at most ${itinerary.maxGroupSize} travelers per booking`);
    }

    const endDate = new Date(input.startDate);
    endDate.setDate(endDate.getDate() + itinerary.durationDays);
    const totalPrice = Number(itinerary.pricePerPerson) * input.travelers;

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          travelerId,
          type: "ITINERARY",
          // Package tours need the agency to assign an actual guide, hotel
          // rooms, and vehicle before confirming — not an instant reservation.
          status: "PENDING",
          startDate: input.startDate,
          endDate,
          totalPrice,
        },
      });

      const itineraryBooking = await tx.itineraryBooking.create({
        data: {
          bookingId: booking.id,
          itineraryId: itinerary.id,
          travelers: input.travelers,
          notes: input.notes,
        },
      });

      return { ...booking, itineraryBooking };
    });
  }

  if (input.type === "FLIGHT") {
    const { offer } = input;
    const { pnr, aggregatorOfferId } = await bookFlight(offer);

    return prisma.$transaction(async (tx) => {
      const booking = await tx.booking.create({
        data: {
          travelerId,
          type: "FLIGHT",
          // Ticketing already happened synchronously via the aggregator
          // (a real PNR was issued above), unlike guide/hotel/vehicle
          // bookings which start PENDING awaiting the vendor's confirmation.
          status: "CONFIRMED",
          startDate: offer.outbound.departureAt,
          endDate: offer.inbound?.departureAt ?? offer.outbound.arrivalAt,
          totalPrice: offer.totalPrice,
        },
      });

      const flightBooking = await tx.flightBooking.create({
        data: {
          bookingId: booking.id,
          origin: offer.outbound.origin,
          destination: offer.outbound.destination,
          departureAt: offer.outbound.departureAt,
          returnAt: offer.inbound?.departureAt,
          passengers: offer.passengers,
          cabinClass: offer.cabinClass,
          airline: offer.outbound.airline,
          flightNumber: offer.outbound.flightNumber,
          aggregatorProvider: offer.provider,
          aggregatorOfferId,
          pnr,
        },
      });

      return { ...booking, flightBooking };
    });
  }

  const duration = nightsOrDays(input.startDate, input.endDate);

  if (input.type === "GUIDE") {
    const guide = await prisma.guideProfile.findUnique({
      where: { id: input.guideId },
    });
    if (!guide || guide.status !== "APPROVED") {
      throw new BookingNotFoundError("Guide not found or not approved");
    }
    if (!(await isGuideAvailable(input.guideId, input.startDate, input.endDate))) {
      throw new BookingConflictError("Guide is not available for these dates");
    }
    const totalPrice = duration * Number(guide.ratePerDay);

    return prisma.booking.create({
      data: {
        travelerId,
        type: "GUIDE",
        guideId: input.guideId,
        startDate: input.startDate,
        endDate: input.endDate,
        totalPrice,
      },
    });
  }

  if (input.type === "HOTEL") {
    const roomType = await prisma.roomType.findUnique({
      where: { id: input.roomTypeId },
      include: { hotel: true },
    });
    if (!roomType || roomType.hotel.status !== "APPROVED") {
      throw new BookingNotFoundError("Room type not found or hotel not approved");
    }
    if (!(await isRoomTypeAvailable(input.roomTypeId, input.startDate, input.endDate))) {
      throw new BookingConflictError("No rooms of this type available for these dates");
    }
    const totalPrice = duration * Number(roomType.pricePerNight);

    return prisma.booking.create({
      data: {
        travelerId,
        type: "HOTEL",
        roomTypeId: input.roomTypeId,
        startDate: input.startDate,
        endDate: input.endDate,
        totalPrice,
      },
    });
  }

  // VEHICLE
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: input.vehicleId },
  });
  if (!vehicle || vehicle.status !== "APPROVED") {
    throw new BookingNotFoundError("Vehicle not found or not approved");
  }
  if (!(await isVehicleAvailable(input.vehicleId, input.startDate, input.endDate))) {
    throw new BookingConflictError("Vehicle is not available for these dates");
  }

  const distanceCost = vehicle.ratePerKm
    ? Number(vehicle.ratePerKm) * input.plannedDistanceKm
    : 0;
  const totalPrice = duration * Number(vehicle.ratePerDay) + distanceCost;

  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.create({
      data: {
        travelerId,
        type: "VEHICLE",
        vehicleId: input.vehicleId,
        startDate: input.startDate,
        endDate: input.endDate,
        totalPrice,
      },
    });

    const trip = await tx.trip.create({
      data: {
        bookingId: booking.id,
        vehicleId: input.vehicleId,
        plannedDistanceKm: input.plannedDistanceKm,
        plannedRoute: input.plannedRoute,
      },
    });

    return { ...booking, trip };
  });
}
