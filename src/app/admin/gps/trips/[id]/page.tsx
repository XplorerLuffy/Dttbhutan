import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import RouteComparisonMap from "@/components/map/RouteComparisonMapClient";
import RegenerateReportButton from "@/components/admin/RegenerateReportButton";
import StatusBadge from "@/components/StatusBadge";

type Waypoint = { latitude: number; longitude: number; label?: string };

export default async function TripMileageReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { id } = await params;
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      vehicle: { include: { operator: true } },
      booking: { include: { traveler: true } },
      report: true,
      positions: { orderBy: { recordedAt: "asc" } },
    },
  });
  if (!trip) notFound();

  const plannedRoute = trip.plannedRoute as unknown as Waypoint[];
  const actualTrail = trip.positions.map((p) => ({
    latitude: p.latitude,
    longitude: p.longitude,
  }));
  const report = trip.report;

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Trip mileage verification</h1>
        <StatusBadge status={trip.status} />
      </div>
      <p className="mb-6 text-sm text-stone-600">
        {trip.vehicle.operator.businessName} · {trip.vehicle.type} ({trip.vehicle.plateNumber}) —
        booked by {trip.booking.traveler.name}
      </p>

      {report ? (
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Stat label="Planned distance" value={`${report.plannedDistanceKm.toFixed(1)} km`} />
          <Stat label="Actual (GPS) distance" value={`${report.actualDistanceKm.toFixed(1)} km`} />
          <Stat
            label="Deviation"
            value={`${report.deviationKm >= 0 ? "+" : ""}${report.deviationKm.toFixed(1)} km (${report.deviationPercent.toFixed(1)}%)`}
            emphasize={report.flagged}
          />
          <Stat label="GPS points logged" value={String(report.pointCount)} />
        </div>
      ) : (
        <p className="card mb-6 text-sm text-stone-500">
          No mileage report yet — it&apos;s generated automatically when the trip ends.
        </p>
      )}

      {report?.flagged && (
        <div className="card mb-6 border-red-200 bg-red-50">
          <p className="font-medium text-red-800">Flagged for review</p>
          <p className="text-sm text-red-700">{report.flagReason}</p>
        </div>
      )}

      <div className="mb-4">
        <RouteComparisonMap plannedRoute={plannedRoute} actualTrail={actualTrail} />
      </div>

      <RegenerateReportButton tripId={trip.id} />

      {report && (
        <p className="mt-4 text-xs text-stone-400">
          Report generated {report.generatedAt.toLocaleString()}. Deviation flag threshold:{" "}
          {process.env.GPS_DEVIATION_FLAG_PERCENT ?? "15"}%.
        </p>
      )}
    </div>
  );
}

function Stat({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <div className={`card ${emphasize ? "border-red-200 bg-red-50" : ""}`}>
      <p className="text-xs text-stone-500">{label}</p>
      <p className={`mt-1 text-lg font-semibold ${emphasize ? "text-red-800" : ""}`}>{value}</p>
    </div>
  );
}
