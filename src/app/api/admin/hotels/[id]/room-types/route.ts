import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { roomTypeSchema } from "@/lib/validation";

/** An admin adds a room type to any hotel — the only way for hotels the
 * agency added itself, which have no owner login to do it from. */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: 403 });
    throw err;
  }

  const { id } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!hotel)
    return NextResponse.json({ error: "Hotel not found" }, { status: 404 });

  const parsed = roomTypeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const roomType = await prisma.roomType.create({
    data: { hotelId: hotel.id, ...parsed.data },
  });
  return NextResponse.json(roomType, { status: 201 });
}
