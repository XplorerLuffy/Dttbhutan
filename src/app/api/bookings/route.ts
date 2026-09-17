import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { bookingSchema } from "@/lib/validation";
import { createBooking, BookingConflictError, BookingNotFoundError } from "@/lib/booking";
import { notifyBookingCreated } from "@/lib/email/notify";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Log in to book" }, { status: 401 });
  }
  if (user.role !== "TRAVELER") {
    return NextResponse.json(
      { error: "Only traveler accounts can create bookings" },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const booking = await createBooking(user.id, parsed.data);
    await notifyBookingCreated(booking.id);
    return NextResponse.json(booking, { status: 201 });
  } catch (err) {
    if (err instanceof BookingConflictError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof BookingNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    throw err;
  }
}
