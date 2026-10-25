import { timingSafeEqual } from "node:crypto";

/**
 * Core of POST /api/gps/ingest, kept free of Next and Prisma imports so it can
 * be tested against a fake database. The route wires it to Prisma.
 *
 * Three guarantees the old inline version did not give:
 *  - a deactivated tracker (GpsDevice.status INACTIVE) cannot write;
 *  - the same position sent twice (a retry after a lost response, or a
 *    device re-sending a stored point) is stored once, so retries can never
 *    inflate point counts in the mileage report;
 *  - a position is attached to the in-progress trip only if it was recorded
 *    after that trip started — a tracker uploading stored points after
 *    losing signal must not drop old positions onto a later trip.
 */

export type IngestInput = {
  deviceIdentifier: string;
  latitude: number;
  longitude: number;
  speedKmh?: number;
  heading?: number;
  recordedAt: Date;
};

export type IngestDb = {
  findDevice(deviceIdentifier: string): Promise<{ id: string; vehicleId: string; status: string } | null>;
  findActiveTrip(vehicleId: string): Promise<{ id: string; startedAt: Date | null } | null>;
  findPosition(deviceId: string, recordedAt: Date): Promise<{ id: string; tripId: string | null } | null>;
  createPosition(data: {
    deviceId: string;
    tripId: string | null;
    latitude: number;
    longitude: number;
    speedKmh?: number;
    heading?: number;
    recordedAt: Date;
  }): Promise<{ id: string; tripId: string | null }>;
};

export type IngestResult =
  | { status: 201; body: { id: string; tripId: string | null } }
  | { status: 200; body: { id: string; tripId: string | null; duplicate: true } }
  | { status: 403 | 404; body: { error: string } };

export async function ingestPosition(db: IngestDb, input: IngestInput): Promise<IngestResult> {
  const device = await db.findDevice(input.deviceIdentifier);
  if (!device) return { status: 404, body: { error: "Unknown device" } };
  if (device.status !== "ACTIVE") return { status: 403, body: { error: "Device is inactive" } };

  const existing = await db.findPosition(device.id, input.recordedAt);
  if (existing) {
    return { status: 200, body: { id: existing.id, tripId: existing.tripId, duplicate: true } };
  }

  const trip = await db.findActiveTrip(device.vehicleId);
  const onTrip = trip && (!trip.startedAt || input.recordedAt >= trip.startedAt);

  const created = await db.createPosition({
    deviceId: device.id,
    tripId: onTrip ? trip.id : null,
    latitude: input.latitude,
    longitude: input.longitude,
    speedKmh: input.speedKmh,
    heading: input.heading,
    recordedAt: input.recordedAt,
  });
  return { status: 201, body: { id: created.id, tripId: created.tripId } };
}

/** Constant-time check of the shared secret header. A missing secret never matches. */
export function secretMatches(expected: string | undefined, provided: string | null): boolean {
  if (!expected || !provided) return false;
  const a = Buffer.from(expected);
  const b = Buffer.from(provided);
  return a.length === b.length && timingSafeEqual(a, b);
}
