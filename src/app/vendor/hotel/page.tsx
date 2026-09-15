import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import { SetBookingStatusButton } from "@/components/BookingActions";
import AddRoomTypeForm from "./room-types/AddRoomTypeForm";

export default async function HotelVendorDashboard() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "HOTEL_OPERATOR") redirect(dashboardPathForRole(user.role));

  const hotel = await prisma.hotel.findUnique({
    where: { ownerId: user.id },
    include: { roomTypes: true },
  });
  if (!hotel) redirect("/vendor/hotel/register");

  const bookings = await prisma.booking.findMany({
    where: { roomType: { hotelId: hotel.id } },
    orderBy: { startDate: "desc" },
    include: { traveler: true, roomType: true },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">{hotel.name}</h1>
        <StatusBadge status={hotel.status} />
      </div>

      {hotel.status === "PENDING" && (
        <p className="card mb-6 text-sm text-amber-700">
          Your hotel is awaiting admin approval before it appears in search.
        </p>
      )}

      <h2 className="mb-3 text-lg font-semibold">Room types</h2>
      <div className="mb-3 space-y-2">
        {hotel.roomTypes.map((rt) => (
          <div key={rt.id} className="card flex items-center justify-between">
            <span>{rt.name} — sleeps {rt.capacity}</span>
            <span>
              Nu. {Number(rt.pricePerNight).toLocaleString()}/night · {rt.totalRooms} rooms
            </span>
          </div>
        ))}
      </div>
      <div className="mb-8">
        <AddRoomTypeForm />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-stone-500">No bookings yet.</p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => (
            <div key={b.id} className="card flex items-center justify-between">
              <div>
                <Link href={`/dashboard/bookings/${b.id}`} className="font-medium hover:underline">
                  {b.traveler.name} — {b.roomType?.name}
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
                {b.status === "CONFIRMED" && (
                  <SetBookingStatusButton bookingId={b.id} status="COMPLETED" label="Complete" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
