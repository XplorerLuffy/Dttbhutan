import "server-only";
import { prisma } from "@/lib/prisma";
import { evaluateDeviation, totalTrackDistanceKm } from "@/lib/gps/distance";

const DEFAULT_FLAG_THRESHOLD_PERCENT = 15;

function flagThresholdPercent() {
  const raw = process.env.GPS_DEVIATION_FLAG_PERCENT;
  const parsed = raw ? Number(raw) : NaN;
  return Number.isFinite(parsed) ? parsed : DEFAULT_FLAG_THRESHOLD_PERCENT;
}

/**
 * Regenerates the mileage-verification report for a trip from its logged
 * GPS trail. Safe to call multiple times (e.g. re-run after new positions
 * arrive for a trip that's still in progress, or once it's completed).
 */
export async function generateTripDistanceReport(tripId: string) {
  const trip = await prisma.trip.findUniqueOrThrow({
    where: { id: tripId },
    include: {
      positions: {
        orderBy: { recordedAt: "asc" },
      },
    },
  });

  const points = trip.positions.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));

  const actualDistanceKm = totalTrackDistanceKm(points);
  const deviation = evaluateDeviation(
    actualDistanceKm,
    trip.plannedDistanceKm,
    flagThresholdPercent()
  );

  const first = trip.positions[0];
  const last = trip.positions[trip.positions.length - 1];

  const report = await prisma.tripDistanceReport.upsert({
    where: { tripId },
    create: {
      tripId,
      actualDistanceKm: deviation.actualDistanceKm,
      plannedDistanceKm: deviation.plannedDistanceKm,
      deviationKm: deviation.deviationKm,
      deviationPercent: deviation.deviationPercent,
      flagged: deviation.flagged,
      flagReason: deviation.flagReason,
      startLatitude: first?.latitude,
      startLongitude: first?.longitude,
      endLatitude: last?.latitude,
      endLongitude: last?.longitude,
      pointCount: trip.positions.length,
    },
    update: {
      actualDistanceKm: deviation.actualDistanceKm,
      plannedDistanceKm: deviation.plannedDistanceKm,
      deviationKm: deviation.deviationKm,
      deviationPercent: deviation.deviationPercent,
      flagged: deviation.flagged,
      flagReason: deviation.flagReason,
      startLatitude: first?.latitude,
      startLongitude: first?.longitude,
      endLatitude: last?.latitude,
      endLongitude: last?.longitude,
      pointCount: trip.positions.length,
      generatedAt: new Date(),
    },
  });

  return report;
}
