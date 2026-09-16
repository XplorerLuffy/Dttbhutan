import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customTourRequestSchema } from "@/lib/validation";
import { CustomTourSelectionError, priceCustomTourSelection } from "@/lib/customTour";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to request a custom tour" }, { status: 401 });
  if (user.role !== "TRAVELER") {
    return NextResponse.json({ error: "Only traveler accounts can request a custom tour" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = customTourRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { destinationIds, guideId, roomTypeId, vehicleId, ...rest } = parsed.data;

  let pricing;
  try {
    pricing = await priceCustomTourSelection({
      startDate: rest.startDate,
      endDate: rest.endDate,
      travelers: rest.travelers,
      guideId,
      roomTypeId,
      vehicleId,
    });
  } catch (err) {
    if (err instanceof CustomTourSelectionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }

  const request = await prisma.customTourRequest.create({
    data: {
      ...rest,
      travelerId: user.id,
      destinations: { connect: destinationIds.map((id) => ({ id })) },
      guideId,
      roomTypeId,
      vehicleId,
      roomsNeeded: pricing.roomsNeeded ?? undefined,
      estimatedTotalPrice: pricing.totalPrice || undefined,
      estimatedPricePerPerson: pricing.totalPrice ? pricing.pricePerPerson : undefined,
    },
  });

  return NextResponse.json(request, { status: 201 });
}
