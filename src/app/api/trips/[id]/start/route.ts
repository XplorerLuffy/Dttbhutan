import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { vehicle: { include: { operator: true } } },
  });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const isOwner = trip.vehicle.operator.ownerId === user.id;
  if (!isOwner && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (trip.status !== "NOT_STARTED") {
    return NextResponse.json({ error: "Trip already started" }, { status: 409 });
  }

  const updated = await prisma.trip.update({
    where: { id },
    data: { status: "IN_PROGRESS", startedAt: new Date() },
  });

  return NextResponse.json(updated);
}
