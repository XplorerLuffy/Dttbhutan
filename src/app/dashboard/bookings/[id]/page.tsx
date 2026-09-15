import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import MessageThread from "@/components/MessageThread";
import ReviewForm from "@/components/ReviewForm";
import { CancelBookingButton, SetBookingStatusButton } from "@/components/BookingActions";
import type { Prisma } from "@prisma/client";

type BookingDetail = Prisma.BookingGetPayload<{
  include: {
    traveler: true;
    guide: { include: { user: true } };
    roomType: { include: { hotel: true } };
    vehicle: { include: { operator: true; gpsDevice: true } };
    trip: true;
    review: true;
    flightBooking: true;
    messages: { include: { sender: { select: { name: true; role: true } } } };
  };
}>;

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      traveler: true,
      guide: { include: { user: true } },
      roomType: { include: { hotel: true } },
      vehicle: { include: { operator: true, gpsDevice: true } },
      trip: true,
      review: true,
      flightBooking: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { name: true, role: true } } },
      },
    },
  });
  if (!booking) notFound();

  const isTraveler = booking.travelerId === user.id;
  const isVendorOwner =
    booking.guide?.userId === user.id ||
    booking.roomType?.hotel.ownerId === user.id ||
    booking.vehicle?.operator.ownerId === user.id;
  const isAdmin = user.role === "ADMIN";
  if (!isTraveler && !isVendorOwner && !isAdmin) notFound();

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold">{bookingTitle(booking)}</h1>
              <p className="text-sm text-stone-500">
                {booking.startDate.toDateString()} → {booking.endDate.toDateString()}
              </p>
            </div>
            <StatusBadge status={booking.status} />
          </div>

          <p className="mt-3 font-medium text-brand-800">
            Total: Nu. {Number(booking.totalPrice).toLocaleString()}
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {isTraveler && booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <CancelBookingButton bookingId={booking.id} />
            )}
            {(isVendorOwner || isAdmin) && booking.status === "PENDING" && (
              <SetBookingStatusButton bookingId={booking.id} status="CONFIRMED" label="Confirm" />
            )}
            {(isVendorOwner || isAdmin) && booking.status === "CONFIRMED" && (
              <SetBookingStatusButton bookingId={booking.id} status="COMPLETED" label="Mark completed" />
            )}
            {(isVendorOwner || isAdmin) && booking.status !== "CANCELLED" && booking.status !== "COMPLETED" && (
              <SetBookingStatusButton bookingId={booking.id} status="CANCELLED" label="Cancel" />
            )}
          </div>
        </div>

        {booking.type === "FLIGHT" && booking.flightBooking && (
          <div className="card">
            <h3 className="font-semibold">Flight details</h3>
            <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-stone-500">Route</dt>
              <dd>{booking.flightBooking.origin} → {booking.flightBooking.destination}</dd>
              <dt className="text-stone-500">Airline</dt>
              <dd>{booking.flightBooking.airline} ({booking.flightBooking.flightNumber})</dd>
              <dt className="text-stone-500">Departure</dt>
              <dd>{booking.flightBooking.departureAt.toLocaleString()}</dd>
              {booking.flightBooking.returnAt && (
                <>
                  <dt className="text-stone-500">Return</dt>
                  <dd>{booking.flightBooking.returnAt.toLocaleString()}</dd>
                </>
              )}
              <dt className="text-stone-500">Passengers</dt>
              <dd>{booking.flightBooking.passengers}</dd>
              <dt className="text-stone-500">Cabin</dt>
              <dd>{booking.flightBooking.cabinClass.replace("_", " ")}</dd>
            </dl>
            <p className="mt-3 rounded-md bg-brand-50 px-3 py-2 font-mono text-sm text-brand-800">
              PNR: {booking.flightBooking.pnr}
            </p>
            <p className="mt-1 text-xs text-stone-400">
              Issued via a demo aggregator ({booking.flightBooking.aggregatorProvider}) — not a real
              airline reservation. See README for production integration notes.
            </p>
          </div>
        )}

        {booking.type === "VEHICLE" && booking.trip && (
          <div className="card">
            <h3 className="font-semibold">Trip tracking</h3>
            <p className="text-sm text-stone-500">
              Status: {booking.trip.status.replace("_", " ")}
            </p>
            <Link
              href={`/track/${booking.trip.shareToken}`}
              className="mt-2 inline-block text-brand-700 hover:underline"
            >
              Open live tracking page →
            </Link>
            {isAdmin && booking.trip.status === "COMPLETED" && (
              <Link
                href={`/admin/gps/trips/${booking.trip.id}`}
                className="mt-1 block text-sm text-stone-500 hover:underline"
              >
                View mileage verification report →
              </Link>
            )}
          </div>
        )}

        {booking.type !== "FLIGHT" && booking.status === "COMPLETED" && isTraveler && (
          booking.review ? (
            <div className="card">
              <h3 className="font-semibold">Your review</h3>
              <p className="text-amber-600">{"★".repeat(booking.review.rating)}</p>
              {booking.review.comment && <p className="text-sm text-stone-600">{booking.review.comment}</p>}
            </div>
          ) : (
            <ReviewForm bookingId={booking.id} />
          )
        )}
      </div>

      <div>
        {booking.type !== "FLIGHT" && (
          <MessageThread
            bookingId={booking.id}
            currentUserName={user.name}
            initialMessages={booking.messages.map((m) => ({
              ...m,
              createdAt: m.createdAt.toISOString(),
            }))}
          />
        )}
      </div>
    </div>
  );
}

function bookingTitle(booking: BookingDetail) {
  if (booking.type === "GUIDE") return `Guide: ${booking.guide?.user.name}`;
  if (booking.type === "HOTEL")
    return `Hotel: ${booking.roomType?.hotel.name} — ${booking.roomType?.name}`;
  if (booking.type === "FLIGHT")
    return `Flight: ${booking.flightBooking?.origin} → ${booking.flightBooking?.destination}`;
  return `Transport: ${booking.vehicle?.operator.businessName} (${booking.vehicle?.type})`;
}
