import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import { SetBookingStatusButton } from "@/components/BookingActions";
import TripControls from "@/components/TripControls";
import AddVehicleForm from "./vehicles/AddVehicleForm";

export default async function TransportVendorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TRANSPORT_OPERATOR") redirect(dashboardPathForRole(user.role));

  const operator = await prisma.transportOperator.findUnique({
    where: { ownerId: user.id },
    include: { vehicles: { include: { gpsDevice: true } } },
  });
  if (!operator) redirect("/vendor/transport/register");

  const bookings = await prisma.booking.findMany({
    where: { vehicle: { operatorId: operator.id } },
    orderBy: { startDate: "desc" },
    include: { traveler: true, vehicle: { include: { gpsDevice: true } }, trip: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{operator.businessName}</h1>
        <StatusBadge status={operator.status} />
      </div>

      {operator.status === "PENDING" && (
        <p className="card mb-6 text-sm text-amber-700">
          Your business is awaiting admin approval before your vehicles appear in search.
        </p>
      )}

      <h2 className="mb-3 text-lg font-semibold">Vehicles</h2>
      <div className="mb-3 space-y-2">
        {operator.vehicles.map((v) => (
          <div key={v.id} className="card flex items-center justify-between">
            <div>
              <span className="font-medium">
                {v.type} · {v.plateNumber}
              </span>
              <span className="ml-2 text-sm text-stone-500">Driver: {v.driverName}</span>
            </div>
            <div className="flex items-center gap-2">
              {v.gpsDevice ? (
                <span className="text-xs text-brand-700">GPS linked</span>
              ) : (
                <span className="text-xs text-stone-400">No GPS device</span>
              )}
              <StatusBadge status={v.status} />
            </div>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <AddVehicleForm />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-stone-500">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/dashboard/bookings/${b.id}`} className="font-medium hover:underline">
                    {b.traveler.name} — {b.vehicle?.type} {b.vehicle?.plateNumber}
                  </Link>
                  <p className="text-sm text-stone-500">
                    {b.startDate.toDateString()} → {b.endDate.toDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={b.status} />
                  {b.status === "PENDING" && (
                    <SetBookingStatusButton bookingId={b.id} status="CONFIRMED" label="Confirm" />
                  )}
                </div>
              </div>
              {b.trip && b.status === "CONFIRMED" && (
                <div className="mt-3 border-t border-stone-100 pt-3">
                  <TripControls
                    tripId={b.trip.id}
                    status={b.trip.status}
                    hasGpsDevice={Boolean(b.vehicle?.gpsDevice)}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
