import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminHotelCreateSchema } from "@/lib/validation";
import { VendorAccountConflict, vendorAccountFor } from "@/lib/adminVendor";
import { revalidateHomepage } from "@/lib/revalidate";

/**
 * An admin adds a hotel directly, with its owner's account and a first room
 * type — a hotel with no room types can't be booked, so one is required here
 * just as it is when an owner registers. Everything is created in one
 * transaction, and the listing goes live as APPROVED.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: 403 });
    throw err;
  }

  const parsed = adminHotelCreateSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { contact, hotel, roomType } = parsed.data;

  try {
    const created = await prisma.$transaction(async (tx) => {
      const ownerId = await vendorAccountFor(tx, contact, "HOTEL_OPERATOR");
      return tx.hotel.create({
        data: {
          ...hotel,
          ownerId,
          status: "APPROVED",
          adminNote: "Added by an admin.",
          roomTypes: { create: roomType },
        },
        select: { id: true },
      });
    });

    revalidateHomepage();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof VendorAccountConflict) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
