import { notFound } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { prisma } from "@/lib/prisma";
import { haversineDistanceKm } from "@/lib/gps/distance";
import LiveTrackingMap from "@/components/map/LiveTrackingMapClient";
import LiveRefresher from "@/components/LiveRefresher";
import StatusBadge from "@/components/StatusBadge";

type Waypoint = { latitude: number; longitude: number; label?: string };

const STALE_AFTER_MINUTES = 20;

export default async function TrackTripPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const trip = await prisma.trip.findUnique({
    where: { shareToken: token },
    include: {
      vehicle: true,
      positions: { orderBy: { recordedAt: "desc" }, take: 1 },
    },
  });
  if (!trip) notFound();

  const route = trip.plannedRoute as unknown as Waypoint[];
  const lastPosition = trip.positions[0] ?? null;
  const destination = route[route.length - 1];

  let etaMinutes: number | null = null;
  if (lastPosition && destination && trip.status === "IN_PROGRESS") {
    const remainingKm = haversineDistanceKm(lastPosition, destination);
    const speedKmh = lastPosition.speedKmh && lastPosition.speedKmh > 5 ? lastPosition.speedKmh : 30;
    etaMinutes = Math.round((remainingKm / speedKmh) * 60);
  }

  const isStale =
    lastPosition &&
    Date.now() - lastPosition.recordedAt.getTime() > STALE_AFTER_MINUTES * 60 * 1000;

  return (
    <div className="mx-auto max-w-2xl">
      {trip.status === "IN_PROGRESS" && <LiveRefresher intervalMs={15000} />}

      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">
          {trip.vehicle.type} trip — {destination?.label ?? "destination"}
        </h1>
        <StatusBadge status={trip.status} />
      </div>

      <div className="card mb-4">
        {lastPosition ? (
          <>
            <p className="text-sm text-stone-600">
              Last known location:{" "}
              <span className="font-medium text-stone-900">
                {formatDistanceToNow(lastPosition.recordedAt, { addSuffix: true })}
              </span>{" "}
              ({lastPosition.recordedAt.toLocaleString()})
            </p>
            {isStale && (
              <p className="mt-1 text-sm text-amber-700">
                No signal for a while — Bhutan&apos;s mountain roads have patchy
                coverage. This is the last position received; it will update
                automatically once the vehicle reconnects.
              </p>
            )}
            {etaMinutes !== null && (
              <p className="mt-1 text-sm text-stone-600">
                Estimated time to {destination?.label ?? "destination"}:{" "}
                <span className="font-medium">~{etaMinutes} min</span>
              </p>
            )}
          </>
        ) : trip.status === "NOT_STARTED" ? (
          <p className="text-sm text-stone-600">This trip hasn&apos;t started yet.</p>
        ) : (
          <p className="text-sm text-stone-600">
            Waiting for the first GPS position from this vehicle.
          </p>
        )}
      </div>

      <LiveTrackingMap
        route={route}
        currentPosition={lastPosition ? { latitude: lastPosition.latitude, longitude: lastPosition.longitude } : null}
      />

      <p className="mt-4 text-center text-xs text-stone-400">
        This is a shared tracking link — anyone with it can view this trip&apos;s
        last known location, no account required.
      </p>
    </div>
  );
}
