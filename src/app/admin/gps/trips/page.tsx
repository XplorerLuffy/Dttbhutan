import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";

export default async function AdminGpsTripsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const trips = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { include: { operator: true } },
      booking: { include: { traveler: true } },
      report: true,
    },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">GPS mileage reports</h1>
      <p className="mb-6 text-sm text-stone-600">
        Planned vs. GPS-verified distance for every vehicle trip. Flagged
        trips deviate from the quoted route by more than the configured
        threshold and are the ones worth pulling up for a driver/client
        dispute.
      </p>

      <div className="space-y-2">
        {trips.map((t) => (
          <Link
            key={t.id}
            href={`/admin/gps/trips/${t.id}`}
            className="card flex items-center justify-between hover:shadow-md"
          >
            <div>
              <p className="font-medium">
                {t.vehicle.operator.businessName} · {t.vehicle.type} — {t.booking.traveler.name}
              </p>
              <p className="text-sm text-stone-500">
                Planned {t.plannedDistanceKm} km
                {t.report && ` · Actual ${t.report.actualDistanceKm.toFixed(1)} km`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {t.report?.flagged && (
                <span className="badge bg-red-100 text-red-800">Flagged</span>
              )}
              <StatusBadge status={t.status} />
            </div>
          </Link>
        ))}
        {trips.length === 0 && <p className="text-sm text-stone-500">No trips yet.</p>}
      </div>
    </div>
  );
}
