export type LatLng = { latitude: number; longitude: number };

const EARTH_RADIUS_KM = 6371;

/**
 * Great-circle distance between two points, in kilometers.
 * This is what "actual distance driven" is derived from — not the driver's
 * self-reported odometer reading.
 */
export function haversineDistanceKm(a: LatLng, b: LatLng): number {
  const dLat = toRadians(b.latitude - a.latitude);
  const dLng = toRadians(b.longitude - a.longitude);
  const lat1 = toRadians(a.latitude);
  const lat2 = toRadians(b.latitude);

  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

/**
 * Sums haversine distance across a sequence of GPS points, in the order
 * given (points should already be sorted by recordedAt).
 *
 * A single point-to-point leg longer than `maxLegKm` is treated as a GPS
 * dropout (device went offline, then reported again far away) rather than
 * real driven distance, and is excluded from the running total — otherwise
 * a signal gap in Bhutan's mountainous terrain would look like teleportation
 * and inflate the "actual distance" figure.
 */
export function totalTrackDistanceKm(
  points: LatLng[],
  options: { maxLegKm?: number } = {}
): number {
  const maxLegKm = options.maxLegKm ?? 50;
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const leg = haversineDistanceKm(points[i - 1], points[i]);
    if (leg <= maxLegKm) {
      total += leg;
    }
  }
  return total;
}

export type DeviationResult = {
  actualDistanceKm: number;
  plannedDistanceKm: number;
  deviationKm: number;
  deviationPercent: number;
  flagged: boolean;
  flagReason: string | null;
};

/**
 * Compares GPS-verified actual distance to the planned/quoted route
 * distance for a trip, and decides whether the gap is large enough to flag
 * for admin/dispute review.
 */
export function evaluateDeviation(
  actualDistanceKm: number,
  plannedDistanceKm: number,
  flagThresholdPercent: number
): DeviationResult {
  const deviationKm = actualDistanceKm - plannedDistanceKm;
  const deviationPercent =
    plannedDistanceKm > 0 ? (deviationKm / plannedDistanceKm) * 100 : 0;
  const flagged = Math.abs(deviationPercent) >= flagThresholdPercent;

  let flagReason: string | null = null;
  if (flagged) {
    flagReason =
      deviationPercent > 0
        ? `Actual GPS distance is ${deviationPercent.toFixed(1)}% higher than the planned route — possible detour or overcharge.`
        : `Actual GPS distance is ${Math.abs(deviationPercent).toFixed(1)}% lower than the planned route.`;
  }

  return {
    actualDistanceKm: round2(actualDistanceKm),
    plannedDistanceKm: round2(plannedDistanceKm),
    deviationKm: round2(deviationKm),
    deviationPercent: round2(deviationPercent),
    flagged,
    flagReason,
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}
