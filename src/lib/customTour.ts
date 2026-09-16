import "server-only";
import { prisma } from "@/lib/prisma";
import { nightsOrDays } from "@/lib/booking";
import {
  isGuideAvailable,
  isVehicleAvailable,
  availableRoomCount,
} from "@/lib/availability";

export class CustomTourSelectionError extends Error {}

export type CustomTourSelectionInput = {
  startDate: Date;
  endDate: Date;
  travelers: number;
  guideId?: string;
  roomTypeId?: string;
  vehicleId?: string;
};

export type CustomTourPriceBreakdown = {
  nights: number;
  roomsNeeded: number | null;
  guideCost: number;
  hotelCost: number;
  vehicleCost: number;
  totalPrice: number;
  pricePerPerson: number;
};

/**
 * Validates the traveler's guide/hotel/vehicle picks (approved + actually
 * available for the requested dates/capacity) and computes the price from
 * each vendor's real posted rate — never trusts a client-sent total.
 * Any of the three picks may be omitted ("no preference").
 */
export async function priceCustomTourSelection(
  input: CustomTourSelectionInput
): Promise<CustomTourPriceBreakdown> {
  const { startDate, endDate, travelers, guideId, roomTypeId, vehicleId } = input;
  const nights = nightsOrDays(startDate, endDate);

  let guideCost = 0;
  if (guideId) {
    const guide = await prisma.guideProfile.findUnique({ where: { id: guideId } });
    if (!guide || guide.status !== "APPROVED") {
      throw new CustomTourSelectionError("Selected guide is not available for booking");
    }
    if (!(await isGuideAvailable(guideId, startDate, endDate))) {
      throw new CustomTourSelectionError("Selected guide is not free for these dates");
    }
    guideCost = nights * Number(guide.ratePerDay);
  }

  let hotelCost = 0;
  let roomsNeeded: number | null = null;
  if (roomTypeId) {
    const roomType = await prisma.roomType.findUnique({
      where: { id: roomTypeId },
      include: { hotel: true },
    });
    if (!roomType || roomType.hotel.status !== "APPROVED") {
      throw new CustomTourSelectionError("Selected hotel is not available for booking");
    }
    roomsNeeded = Math.max(1, Math.ceil(travelers / roomType.capacity));
    const freeRooms = await availableRoomCount(roomTypeId, startDate, endDate);
    if (freeRooms < roomsNeeded) {
      throw new CustomTourSelectionError("Not enough rooms of this type available for these dates");
    }
    hotelCost = nights * Number(roomType.pricePerNight) * roomsNeeded;
  }

  let vehicleCost = 0;
  if (vehicleId) {
    const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
    if (!vehicle || vehicle.status !== "APPROVED") {
      throw new CustomTourSelectionError("Selected vehicle is not available for booking");
    }
    if (vehicle.capacity < travelers) {
      throw new CustomTourSelectionError("Selected vehicle doesn't have enough seats for this group");
    }
    if (!(await isVehicleAvailable(vehicleId, startDate, endDate))) {
      throw new CustomTourSelectionError("Selected vehicle is not free for these dates");
    }
    vehicleCost = nights * Number(vehicle.ratePerDay);
  }

  const totalPrice = guideCost + hotelCost + vehicleCost;
  return {
    nights,
    roomsNeeded,
    guideCost,
    hotelCost,
    vehicleCost,
    totalPrice,
    pricePerPerson: totalPrice / travelers,
  };
}
