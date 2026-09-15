import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import type { Prisma } from "@prisma/client";

export default async function TravelerDashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "TRAVELER") redirect(dashboardPathForRole(user.role));

  const bookings = await prisma.booking.findMany({
    where: { travelerId: user.id },
    orderBy: { startDate: "desc" },
    include: {
      guide: { include: { user: true } },
      roomType: { include: { hotel: true } },
      vehicle: { include: { operator: true } },
      trip: true,
      review: true,
      flightBooking: true,
      itineraryBooking: { include: { itinerary: true } },
    },
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.endDate >= now && b.status !== "CANCELLED");
  const past = bookings.filter((b) => b.endDate < now || b.status === "CANCELLED");

  const customTourRequests = await prisma.customTourRequest.findMany({
    where: { travelerId: user.id },
    orderBy: { createdAt: "desc" },
    include: { destinations: true },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">My trips</h1>
      <p className="mb-6 text-sm text-stone-600">
        Welcome back, {user.name}.
      </p>

      <Section title="Upcoming & active" bookings={upcoming} />
      <Section title="Past & cancelled" bookings={past} />

      {customTourRequests.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-3 text-lg font-semibold">Custom tour requests</h2>
          <div className="space-y-3">
            {customTourRequests.map((r) => (
              <div key={r.id} className="card">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{r.destinations.map((d) => d.name).join(", ")}</p>
                  <StatusBadge status={r.status} />
                </div>
                <p className="text-sm text-stone-500">
                  {r.startDate.toDateString()} → {r.endDate.toDateString()} · {r.travelers} traveler
                  {r.travelers > 1 ? "s" : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

type BookingRow = Prisma.BookingGetPayload<{
  include: {
    guide: { include: { user: true } };
    roomType: { include: { hotel: true } };
    vehicle: { include: { operator: true } };
    trip: true;
    review: true;
    flightBooking: true;
    itineraryBooking: { include: { itinerary: true } };
  };
}>;

function Section({ title, bookings }: { title: string; bookings: BookingRow[] }) {
  return (
    <div className="mb-8">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-stone-500">Nothing here yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <Link
              key={b.id}
              href={`/dashboard/bookings/${b.id}`}
              className="card flex items-center justify-between hover:shadow-md"
            >
              <div>
                <p className="font-medium">{bookingLabel(b)}</p>
                <p className="text-sm text-stone-500">
                  {b.startDate.toDateString()} → {b.endDate.toDateString()}
                </p>
              </div>
              <div className="text-right">
                <StatusBadge status={b.status} />
                {b.type === "VEHICLE" && b.trip && (
                  <p className="mt-1 text-xs text-brand-700">Live tracking available</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function bookingLabel(b: BookingRow) {
  if (b.type === "GUIDE") return `Guide: ${b.guide?.user.name}`;
  if (b.type === "HOTEL") return `Hotel: ${b.roomType?.hotel.name} (${b.roomType?.name})`;
  if (b.type === "FLIGHT")
    return `Flight: ${b.flightBooking?.origin} → ${b.flightBooking?.destination} (${b.flightBooking?.airline})`;
  if (b.type === "ITINERARY") return `Package: ${b.itineraryBooking?.itinerary.title}`;
  return `Transport: ${b.vehicle?.operator.businessName} (${b.vehicle?.type})`;
}
