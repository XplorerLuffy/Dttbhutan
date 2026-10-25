import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { gpsIngestSchema } from "@/lib/validation";
import { ingestPosition, secretMatches, type IngestDb } from "@/lib/gps/ingest";

/**
 * Inbound webhook for GPS position updates. Callers: Traccar's "Forwarding"
 * feature, a bridging script, or the JT808 TCP server in /gps-server. Each
 * sends the shared secret as `x-ingest-secret`.
 *
 * Each position is matched to a GpsDevice by `deviceIdentifier`, then
 * attached to that device's vehicle's currently IN_PROGRESS trip, if any (and
 * only if it was recorded after the trip started). A position with no active
 * trip is still stored against the device, with tripId null — useful for
 * last-known-location diagnostics, but excluded from any trip's mileage
 * report. Re-sending a position (same device, same recordedAt) is a no-op that
 * answers 200 { duplicate: true }; a new position answers 201.
 */
const db: IngestDb = {
  findDevice: (deviceIdentifier) =>
    prisma.gpsDevice.findUnique({
      where: { deviceIdentifier },
      select: { id: true, vehicleId: true, status: true },
    }),
  findActiveTrip: (vehicleId) =>
    prisma.trip.findFirst({
      where: { vehicleId, status: "IN_PROGRESS" },
      select: { id: true, startedAt: true },
    }),
  findPosition: (deviceId, recordedAt) =>
    prisma.gpsPosition.findFirst({ where: { deviceId, recordedAt }, select: { id: true, tripId: true } }),
  createPosition: (data) =>
    prisma.gpsPosition.create({
      data: { ...data, tripId: data.tripId ?? undefined },
      select: { id: true, tripId: true },
    }),
};

export async function POST(req: NextRequest) {
  if (!secretMatches(process.env.GPS_INGEST_SECRET, req.headers.get("x-ingest-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = gpsIngestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const result = await ingestPosition(db, parsed.data);
  return NextResponse.json(result.body, { status: result.status });
}
