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

  const pending = bookings.filter((b) => b.status === "PENDING").length;
  const rooms = hotel.roomTypes.reduce((n, rt) => n + rt.totalRooms, 0);

  return (
    <VendorPage>
      <VendorHero
        title={hotel.name}
        subtitle="Your hotel on Droelma Tours & Travels"
        status={hotel.status}
      />

      {hotel.status === "PENDING" && (
        <VendorNotice tone="amber">
          Your hotel is awaiting admin approval before it appears in search.
        </VendorNotice>
      )}

      <VendorStats
        items={[
          { label: "Room types", value: hotel.roomTypes.length },
          { label: "Rooms in total", value: rooms },
          { label: "Awaiting your reply", value: pending },
          { label: "All bookings", value: bookings.length },
        ]}
      />

      <VendorPanel title="Room types">
        {hotel.roomTypes.length === 0 ? (
          <EmptyRow>No room types yet — add your first below.</EmptyRow>
        ) : (
          <ul className="divide-y divide-stone-100">
            {hotel.roomTypes.map((rt) => (
              <li
                key={rt.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0"
              >
                <span className="text-sm font-semibold text-stone-900">
                  {rt.name}{" "}
                  <span className="font-normal text-stone-500">
                    — sleeps {rt.capacity}
                  </span>
                </span>
                <span className="text-sm text-stone-700">
                  Nu. {Number(rt.pricePerNight).toLocaleString("en-IN")}/night ·{" "}
                  {rt.totalRooms} rooms
                </span>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4 border-t border-stone-100 pt-4">
          <AddRoomTypeForm />
        </div>
      </VendorPanel>

      <VendorPanel title="Bookings">
        {bookings.length === 0 ? (
          <EmptyRow>No bookings yet.</EmptyRow>
        ) : (
          <ul className="divide-y divide-stone-100">
            {bookings.map((b) => (
              <li
                key={b.id}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-3.5 first:pt-0 last:pb-0"
              >
                <div className="min-w-0">
                  <Link
                    href={`/dashboard/bookings/${b.id}`}
                    className="text-sm font-semibold text-stone-900 hover:underline"
                  >
                    {b.traveler.name} — {b.roomType?.name}
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
                  {b.status === "CONFIRMED" && (
                    <SetBookingStatusButton
                      bookingId={b.id}
                      status="COMPLETED"
                      label="Complete"
                    />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </VendorPanel>
    </VendorPage>
  );
}
