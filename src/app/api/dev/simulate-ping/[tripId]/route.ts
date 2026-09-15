import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Waypoint = { latitude: number; longitude: number; label?: string };

/**
 * DEMO/DEV ONLY — simulates one GPS ping arriving from the vehicle's
 * device, by interpolating along the trip's planned route. This stands in
 * for the real pipeline (a physical GPS unit -> Traccar -> the
 * `/api/gps/ingest` webhook) so the live-tracking and mileage-verification
 * UI can be exercised end to end without real hardware.
 *
 * Not used in production once actual GPS devices are reporting — remove
 * (or leave gated behind admin/owner auth, as it already is) once Traccar
 * is wired up for real.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { tripId } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: {
      vehicle: { include: { operator: true, gpsDevice: true } },
      positions: { orderBy: { recordedAt: "asc" } },
    },
  });
  if (!trip) return NextResponse.json({ error: "Trip not found" }, { status: 404 });

  const isOwner = trip.vehicle.operator.ownerId === user.id;
  if (!isOwner && user.role !== "ADMIN") {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }
  if (trip.status !== "IN_PROGRESS") {
    return NextResponse.json({ error: "Trip is not in progress" }, { status: 409 });
  }
  if (!trip.vehicle.gpsDevice) {
    return NextResponse.json(
      { error: "This vehicle has no GPS device linked" },
      { status: 400 }
    );
  }

  const route = trip.plannedRoute as unknown as Waypoint[];
  const start = route[0];
  const end = route[route.length - 1];

  const totalSteps = 8;
  const nextStep = Math.min(trip.positions.length + 1, totalSteps);
  const fraction = nextStep / totalSteps;

  // Small random jitter so the simulated trail isn't a perfectly straight
  // line — closer to what a real GPS trail on mountain roads looks like,
  // and enough to occasionally exercise the deviation-flagging logic.
  const jitter = () => (Math.random() - 0.5) * 0.01;

  const latitude = start.latitude + (end.latitude - start.latitude) * fraction + jitter();
  const longitude =
    start.longitude + (end.longitude - start.longitude) * fraction + jitter();

  const position = await prisma.gpsPosition.create({
    data: {
      deviceId: trip.vehicle.gpsDevice.id,
      tripId: trip.id,
      latitude,
      longitude,
      speedKmh: 30 + Math.random() * 40,
      heading: 0,
      recordedAt: new Date(),
    },
  });

  return NextResponse.json({ ...position, isFinalStep: nextStep >= totalSteps });
}
