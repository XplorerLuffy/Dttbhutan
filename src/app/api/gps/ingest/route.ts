import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gpsIngestSchema } from "@/lib/validation";

/**
 * Inbound webhook for GPS position updates. Point Traccar's "Forwarding"
 * feature (or any bridging script for a vendor-provided GPS platform) at
 * this URL, sending the shared secret as `x-ingest-secret`.
 *
 * Each position is matched to a GpsDevice by `deviceIdentifier`, then
 * attached to that device's vehicle's currently IN_PROGRESS trip, if any.
 * A position that arrives with no active trip (device idling between
 * bookings) is still stored against the device, just with tripId null —
 * useful for last-known-location diagnostics, but excluded from any trip's
 * mileage report.
 */
export async function POST(req: NextRequest) {
  const expectedSecret = process.env.GPS_INGEST_SECRET;
  const providedSecret = req.headers.get("x-ingest-secret");
  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = gpsIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { deviceIdentifier, latitude, longitude, speedKmh, heading, recordedAt } =
    parsed.data;

  const device = await prisma.gpsDevice.findUnique({
    where: { deviceIdentifier },
  });
  if (!device) {
    return NextResponse.json({ error: "Unknown device" }, { status: 404 });
  }

  const activeTrip = await prisma.trip.findFirst({
    where: { vehicleId: device.vehicleId, status: "IN_PROGRESS" },
    select: { id: true },
  });

  const position = await prisma.gpsPosition.create({
    data: {
      deviceId: device.id,
      tripId: activeTrip?.id,
      latitude,
      longitude,
      speedKmh,
      heading,
      recordedAt,
    },
  });

  return NextResponse.json({ id: position.id, tripId: position.tripId }, { status: 201 });
}
