import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { messageSchema } from "@/lib/validation";

async function assertParticipant(bookingId: string, userId: string) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      guide: true,
      roomType: { include: { hotel: true } },
      vehicle: { include: { operator: true } },
    },
  });
  if (!booking) return null;

  const isParticipant =
    booking.travelerId === userId ||
    booking.guide?.userId === userId ||
    booking.roomType?.hotel.ownerId === userId ||
    booking.vehicle?.operator.ownerId === userId;

  return isParticipant ? booking : null;
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const booking =
    user.role === "ADMIN"
      ? await prisma.booking.findUnique({ where: { id } })
      : await assertParticipant(id, user.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const messages = await prisma.message.findMany({
    where: { bookingId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { name: true, role: true } } },
  });

  return NextResponse.json(messages);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const booking = await assertParticipant(id, user.id);
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const body = await req.json().catch(() => null);
  const parsed = messageSchema.safeParse({ ...body, bookingId: id });
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const message = await prisma.message.create({
    data: { bookingId: id, senderId: user.id, body: parsed.data.body },
    include: { sender: { select: { name: true, role: true } } },
  });

  return NextResponse.json(message, { status: 201 });
}
