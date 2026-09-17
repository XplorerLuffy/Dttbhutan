import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notifyBookingStatusChanged } from "@/lib/email/notify";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["CONFIRMED", "CANCELLED", "COMPLETED"]),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      guide: true,
      roomType: { include: { hotel: true } },
      vehicle: { include: { operator: true } },
    },
  });
  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const isTraveler = booking.travelerId === user.id;
  const isVendorOwner =
    booking.guide?.userId === user.id ||
    booking.roomType?.hotel.ownerId === user.id ||
    booking.vehicle?.operator.ownerId === user.id;
  const isAdmin = user.role === "ADMIN";

  if (!isTraveler && !isVendorOwner && !isAdmin) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  // Travelers may only cancel; confirming/completing is a vendor or admin action.
  if (isTraveler && !isVendorOwner && !isAdmin && parsed.data.status !== "CANCELLED") {
    return NextResponse.json(
      { error: "Travelers can only cancel a booking" },
      { status: 403 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: { status: parsed.data.status },
  });

  await notifyBookingStatusChanged(id, parsed.data.status, user.email);

  return NextResponse.json(updated);
}
