import Link from "next/link";
import { redirect } from "next/navigation";
import { Prisma, type BookingStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import ListFilters from "@/components/admin/ListFilters";
import Pager from "@/components/admin/Pager";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 25;
const STATUSES: BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];

/**
 * All bookings — but findable.
 *
 * This was one list of a hundred rows in date order, every row the same, which
 * meant the nine awaiting confirmation were scattered through it and had to be
 * hunted for. Status is now a filter in the URL (so the overview can link
 * straight at the pending ones), a reference or a traveller's name can be
 * searched for, and the list is paged rather than growing without limit.
 */
export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const sp = await searchParams;
  const one = (key: string) => (Array.isArray(sp[key]) ? sp[key][0] : sp[key]) ?? "";

  // Anything that is not one of ours shows everything, rather than erroring or
  // quietly returning nothing on a hand-typed URL.
  const statusParam = one("status").toUpperCase();
  const status = STATUSES.includes(statusParam as BookingStatus)
    ? (statusParam as BookingStatus)
    : "";
  const query = one("q").trim();
  const requestedPage = Math.max(1, Number.parseInt(one("page"), 10) || 1);

  const where: Prisma.BookingWhereInput = {
    ...(status ? { status } : {}),
    // Everything a row actually shows is searchable, which is the only rule
    // that does not surprise: a package title is right there on screen, so
    // typing it and getting nothing reads as the search being broken.
    ...(query
      ? {
          OR: [
            { reference: { contains: query, mode: "insensitive" } },
            { traveler: { name: { contains: query, mode: "insensitive" } } },
            { traveler: { email: { contains: query, mode: "insensitive" } } },
            { itineraryBooking: { itinerary: { title: { contains: query, mode: "insensitive" } } } },
            { roomType: { hotel: { name: { contains: query, mode: "insensitive" } } } },
            { guide: { user: { name: { contains: query, mode: "insensitive" } } } },
            { vehicle: { operator: { businessName: { contains: query, mode: "insensitive" } } } },
            { flightBooking: { airline: { contains: query, mode: "insensitive" } } },
            { flightBooking: { origin: { contains: query, mode: "insensitive" } } },
            { flightBooking: { destination: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  // Tab counts ignore the status filter but honour the search, so the numbers
  // describe what switching tabs would actually show.
  const searchOnly: Prisma.BookingWhereInput = { ...where, status: undefined };

  // Counted before the rows are fetched so the page number can be clamped to
  // one that exists. Asking for page 999 of two otherwise returns an empty
  // list, which reads as "no bookings" rather than "you are past the end" —
  // and the same happens by accident when a filter shrinks the list under a
  // page number already in the URL.
  const [total, counts] = await Promise.all([
    prisma.booking.count({ where }),
    prisma.booking.groupBy({ by: ["status"], where: searchOnly, _count: true }),
  ]);

  const page = Math.min(requestedPage, Math.max(1, Math.ceil(total / PAGE_SIZE)));

  const bookings = await prisma.booking.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * PAGE_SIZE,
    take: PAGE_SIZE,
    include: {
      traveler: true,
      guide: { include: { user: true } },
      roomType: { include: { hotel: true } },
      vehicle: { include: { operator: true } },
      flightBooking: true,
      itineraryBooking: { include: { itinerary: true } },
    },
  });

  const countFor = (s: BookingStatus) => counts.find((c) => c.status === s)?._count ?? 0;
  const allCount = counts.reduce((sum, c) => sum + c._count, 0);

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Bookings</h1>
      <p className="mb-5 text-sm text-stone-600">
        Every guide, hotel, vehicle, flight and package booking, newest first.
      </p>

      <ListFilters
        active={status}
        placeholder="Search a reference, name or email"
        tabs={[
          { value: "", label: "All", count: allCount },
          ...STATUSES.map((s) => ({
            value: s,
            label: s.charAt(0) + s.slice(1).toLowerCase(),
            count: countFor(s),
          })),
        ]}
      />

      <div className="space-y-2">
        {bookings.map((b) => (
          <Link
            key={b.id}
            href={`/dashboard/bookings/${b.id}`}
            className="card flex flex-col gap-3 hover:shadow-md sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="font-medium">
                {b.traveler.name} · {vendorLabel(b)}
              </p>
              <p className="text-sm text-stone-500">
                <span className="font-mono text-xs text-stone-600">{b.reference}</span> ·{" "}
                {b.startDate.toDateString()} → {b.endDate.toDateString()} · Nu.{" "}
                {Number(b.totalPrice).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={b.status} />
          </Link>
        ))}

        {bookings.length === 0 && (
          <p className="rounded-lg border border-stone-200 bg-white px-4 py-6 text-center text-sm text-stone-500">
            {query || status
              ? "No bookings match that. Try clearing the search or the status filter."
              : "No bookings yet."}
          </p>
        )}
      </div>

      <Pager page={page} pageSize={PAGE_SIZE} total={total} params={params} />
    </div>
  );
}

function vendorLabel(b: {
  type: string;
  guide: { user: { name: string } } | null;
  roomType: { hotel: { name: string } } | null;
  vehicle: { operator: { businessName: string } } | null;
  flightBooking: { origin: string; destination: string; airline: string } | null;
  itineraryBooking: { itinerary: { title: string } } | null;
}) {
  if (b.type === "GUIDE") return b.guide?.user.name ?? "Guide";
  if (b.type === "HOTEL") return b.roomType?.hotel.name ?? "Hotel";
  if (b.type === "FLIGHT")
    return b.flightBooking
      ? `${b.flightBooking.origin} → ${b.flightBooking.destination} (${b.flightBooking.airline})`
      : "Flight";
  if (b.type === "ITINERARY") return b.itineraryBooking?.itinerary.title ?? "Package";
  return b.vehicle?.operator.businessName ?? "Transport";
}
