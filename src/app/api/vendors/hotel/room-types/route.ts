import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { roomTypeSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("HOTEL_OPERATOR");
    const hotel = await prisma.hotel.findUnique({ where: { ownerId: user.id } });
    if (!hotel) {
      return NextResponse.json({ error: "Register your hotel first" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = roomTypeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const roomType = await prisma.roomType.create({
      data: { hotelId: hotel.id, ...parsed.data },
    });

    return NextResponse.json(roomType, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
