import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import {
  VendorPage,
  VendorHero,
  VendorNotice,
  VendorStats,
  VendorPanel,
  EmptyRow,
} from "@/components/vendor/VendorUI";
import { SetBookingStatusButton } from "@/components/BookingActions";
import TripControls from "@/components/TripControls";
import AddVehicleForm from "./vehicles/AddVehicleForm";

export default async function TransportVendorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TRANSPORT_OPERATOR")
    redirect(dashboardPathForRole(user.role));

  const operator = await prisma.transportOperator.findUnique({
    where: { ownerId: user.id },
    include: { vehicles: { include: { gpsDevice: true } } },
  });
  if (!operator) redirect("/vendor/transport/register");

  const bookings = await prisma.booking.findMany({
    where: { vehicle: { operatorId: operator.id } },
    orderBy: { startDate: "desc" },
    include: {
      traveler: true,
      vehicle: { include: { gpsDevice: true } },
      trip: true,
    },
  });

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const gps = operator.vehicles.filter((v) => v.gpsDevice).length;

  return (
    <VendorPage>
      <VendorHero
        title={operator.businessName}
        subtitle="Your transport business on Droelma Tours & Travels"
        status={operator.status}
      />

      {operator.status === "PENDING" && (
        <VendorNotice tone="amber">
          Your business is awaiting admin approval before your vehicles appear
          in search.
        </VendorNotice>
      )}

      <VendorStats
        items={[
          { label: "Vehicles", value: operator.vehicles.length },
          { label: "With GPS linked", value: gps },
          { label: "Awaiting your reply", value: pending },
          { label: "All bookings", value: bookings.length },
        ]}
      />

      <VendorPanel title="Vehicles">
        {operator.vehicles.length === 0 ? (
          <EmptyRow>No vehicles yet — add your first below.</EmptyRow>
        ) : (
          <ul className="divide-y divide-stone-100">
            {operator.vehicles.map((v) => (
              <li
                key={v.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0"
              >
                <div>
                  <span className="text-sm font-semibold text-stone-900">
                    {v.type} · {v.plateNumber}
                  </span>
                  <span className="ml-2 text-sm text-stone-500">
                    Driver: {v.driverName}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {v.gpsDevice ? (
                    <span className="text-xs text-brand-700">GPS linked</span>
                  ) : (
                    <span className="text-xs text-stone-400">
                      No GPS device
                    </span>
                  )}
                  <StatusBadge status={v.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-stone-100 pt-4">
          <AddVehicleForm />
        </div>
      </VendorPanel>

      <VendorPanel title="Bookings">
        {bookings.length === 0 ? (
          <EmptyRow>No bookings yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-stone-100">
            {bookings.map((b) => (
              <li key={b.id} className="py-3.5 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                  <div className="min-w-0">
                    <Link
                      href={`/dashboard/bookings/${b.id}`}
                      className="text-sm font-semibold text-stone-900 hover:underline"
                    >
                      {b.traveler.name} — {b.vehicle?.type}{" "}
                      {b.vehicle?.plateNumber}
                    </Link>
                    <p className="text-xs text-stone-500">
                      {b.startDate.toDateString()} → {b.endDate.toDateString()}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={b.status} />
                    {b.status === "PENDING" && (
                      <SetBookingStatusButton
                        bookingId={b.id}
                        status="CONFIRMED"
                        label="Confirm"
                      />
                    )}
                  </div>
                </div>
                {b.trip && b.status === "CONFIRMED" && (
                  <div className="mt-3 rounded-xl bg-stone-50 p-3">
                    <TripControls
                      tripId={b.trip.id}
                      status={b.trip.status}
                      hasGpsDevice={Boolean(b.vehicle?.gpsDevice)}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </VendorPanel>
    </VendorPage>
  );
}
