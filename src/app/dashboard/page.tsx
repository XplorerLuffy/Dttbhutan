import Link from "next/link";
import Image from "next/image";
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

  const first = user.name.trim().split(/\s+/)[0];
  const next = [...upcoming].sort((x, y) => x.startDate.getTime() - y.startDate.getTime())[0];
  const stats = [
    { label: "Upcoming & active", value: upcoming.length },
    { label: "Past & cancelled", value: past.length },
    { label: "Custom requests", value: customTourRequests.length },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 64rem, 100vw"
          className="-z-10 object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-8 sm:px-8 sm:py-10">
          <div>
            <h1 className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">My trips</h1>
            <p className="mt-1.5 max-w-md text-sm text-stone-700 sm:text-base">
              Welcome back, {first}.{" "}
              {next
                ? `Your next trip starts ${next.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}.`
                : "Ready to plan your next journey?"}
            </p>
          </div>
          <Link href="/packages" className="btn-primary">
            Browse tours
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-3 gap-3 sm:gap-4" aria-label="Summary">
        {stats.map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{c.value}</p>
          </div>
        ))}
      </section>

      <Section title="Upcoming & active" bookings={upcoming} />
      <Section title="Past & cancelled" bookings={past} />

      {customTourRequests.length > 0 && (
        <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
          <h2 className="mb-3 font-display text-lg font-semibold">Custom tour requests</h2>
          <ul className="divide-y divide-stone-100">
            {customTourRequests.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 py-3.5 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-stone-900">
                    {r.destinations.map((d) => d.name).join(", ")}
                  </p>
                  <p className="text-xs text-stone-500">
                    {r.startDate.toDateString()} → {r.endDate.toDateString()} · {r.travelers} traveler
                    {r.travelers > 1 ? "s" : ""}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        </section>
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
    <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-3 font-display text-lg font-semibold">{title}</h2>
      {bookings.length === 0 ? (
        <p className="rounded-xl bg-stone-50 px-4 py-6 text-center text-sm text-stone-500">Nothing here yet.</p>
      ) : (
        <ul className="divide-y divide-stone-100">
          {bookings.map((b) => (
            <li key={b.id}>
              <Link
                href={`/dashboard/bookings/${b.id}`}
                className="-mx-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl px-2 py-3.5 hover:bg-stone-50"
              >
                <span className="min-w-0 flex-1 basis-56">
                  <span className="block text-sm font-semibold text-stone-900">{bookingLabel(b)}</span>
                  <span className="block text-xs text-stone-500">
                    <span className="font-mono">{b.reference}</span> · {b.startDate.toDateString()} →{" "}
                    {b.endDate.toDateString()}
                  </span>
                </span>
                <span className="text-right">
                  <StatusBadge status={b.status} />
                  {b.type === "VEHICLE" && b.trip && (
                    <span className="mt-1 block text-xs text-brand-700">Live tracking available</span>
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
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
