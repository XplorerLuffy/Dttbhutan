import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

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
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="-z-10 object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <Link href="/chim/gps/trips" className="text-sm font-medium text-brand-700 hover:underline">
            ← All mileage reports
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
              Trip mileage verification
            </h1>
            <StatusBadge status={trip.status} />
          </div>
          <p className="mt-1.5 max-w-2xl text-sm text-stone-700 sm:text-base">
            {trip.vehicle.operator.businessName} · {trip.vehicle.type} ({trip.vehicle.plateNumber}) —
            booked by {trip.booking.traveler.name}
          </p>
        </div>
      </section>

      {report ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
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
        <p className="rounded-2xl border border-stone-200 bg-white p-4 text-sm text-stone-500 shadow-sm">
          No mileage report yet — it&apos;s generated automatically when the trip ends.
        </p>
      )}

      {report?.flagged && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 sm:p-5">
          <p className="font-display text-lg font-semibold text-red-800">Flagged for review</p>
          <p className="text-sm text-red-700">{report.flagReason}</p>
        </div>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-3 shadow-sm sm:p-4">
        <h2 className="mb-3 px-1 font-display text-lg font-semibold">Planned vs. actual route</h2>
        <div className="overflow-hidden rounded-xl">
          <RouteComparisonMap plannedRoute={plannedRoute} actualTrail={actualTrail} />
        </div>
        <div className="mt-4 px-1">
          <RegenerateReportButton tripId={trip.id} />
          {report && (
            <p className="mt-3 text-xs text-stone-500">
              Report generated {report.generatedAt.toLocaleString()}. Deviation flag threshold:{" "}
              {process.env.GPS_DEVIATION_FLAG_PERCENT ?? "15"}%.
            </p>
          )}
        </div>
      </section>
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
    <div
      className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
        emphasize ? "border-red-200 bg-red-50" : "border-stone-200 bg-white"
      }`}
    >
      <p className="text-sm font-medium text-stone-600">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold sm:text-2xl ${emphasize ? "text-red-800" : "text-stone-900"}`}>
        {value}
      </p>
    </div>
  );
}
