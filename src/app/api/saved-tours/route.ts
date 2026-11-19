import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/** Save (POST) or remove (DELETE) a tour on the signed-in traveler's wishlist. Both are idempotent. */
async function traveler() {
  const user = await getCurrentUser();
  if (!user) return { error: NextResponse.json({ error: "Log in to save tours" }, { status: 401 }) };
  if (user.role !== "TRAVELER") return { error: NextResponse.json({ error: "Only traveler accounts have a wishlist" }, { status: 403 }) };
  return { user };
}

async function itineraryIdOf(req: NextRequest): Promise<string | null> {
  const body = await req.json().catch(() => null);
  const id = body && typeof body.itineraryId === "string" ? body.itineraryId : null;
  return id && id.length <= 64 ? id : null;
}

export async function POST(req: NextRequest) {
  const t = await traveler();
  if (t.error) return t.error;
  const itineraryId = await itineraryIdOf(req);
  if (!itineraryId) return NextResponse.json({ error: "itineraryId required" }, { status: 400 });
  const tour = await prisma.itinerary.findFirst({ where: { id: itineraryId, status: "PUBLISHED" }, select: { id: true } });
  if (!tour) return NextResponse.json({ error: "Tour not found" }, { status: 404 });
  await prisma.savedTour.upsert({
    where: { userId_itineraryId: { userId: t.user!.id, itineraryId } },
    create: { userId: t.user!.id, itineraryId },
    update: {},
  });
  return NextResponse.json({ saved: true }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const t = await traveler();
  if (t.error) return t.error;
  const itineraryId = await itineraryIdOf(req);
  if (!itineraryId) return NextResponse.json({ error: "itineraryId required" }, { status: 400 });
  await prisma.savedTour.deleteMany({ where: { userId: t.user!.id, itineraryId } });
  return NextResponse.json({ saved: false });
}
