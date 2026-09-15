import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateTripDistanceReport } from "@/lib/gps/report";

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
  if (trip.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Trip is not in progress" }, { status: 409 });
  }

  await prisma.trip.update({
    where: { id },
    data: { status: "COMPLETED", endedAt: new Date() },
  });

  // Compute the GPS-verified mileage report the moment the trip ends —
  // this is the artifact admins pull up for driver/client mileage disputes.
  const report = await generateTripDistanceReport(id);

  return NextResponse.json(report);
}
