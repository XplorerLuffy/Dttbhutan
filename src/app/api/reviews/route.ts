import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { reviewSchema } from "@/lib/validation";
import type { ReviewTargetType } from "@prisma/client";

// BookingType and ReviewTargetType share the same member names by design.
const REVIEW_TARGET_TYPE: Record<string, ReviewTargetType> = {
  GUIDE: "GUIDE",
  HOTEL: "HOTEL",
  VEHICLE: "VEHICLE",
  ITINERARY: "ITINERARY",
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = reviewSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: parsed.data.bookingId },
    include: { itineraryBooking: true },
  });
  if (!booking || booking.travelerId !== user.id) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }
  // Reviews are tied to completed bookings only, so a review always maps to
  // a real, finished stay/trip/tour rather than an unlinked or fake one.
  if (booking.status !== "COMPLETED") {
    return NextResponse.json(
      { error: "You can only review a completed booking" },
      { status: 400 }
    );
  }

  const targetType = REVIEW_TARGET_TYPE[booking.type];
  const targetId =
    booking.guideId ?? booking.roomTypeId ?? booking.vehicleId ?? booking.itineraryBooking?.itineraryId;
  if (!targetId) {
    return NextResponse.json({ error: "Booking has no reviewable target" }, { status: 400 });
  }

  try {
    const review = await prisma.review.create({
      data: {
        bookingId: booking.id,
        travelerId: user.id,
        targetType,
        targetId,
        rating: parsed.data.rating,
        comment: parsed.data.comment,
      },
    });
    return NextResponse.json(review, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "You've already reviewed this booking" },
      { status: 409 }
    );
  }
}
