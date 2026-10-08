import Link from "next/link";
import Image from "next/image";
import { Prisma, type BookingStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

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

  // Value of everything the filter matches, not just this page: summed in the
  // database so it stays right past the first 25 rows.
  const value = await prisma.booking.aggregate({
    where: { ...where, status: status || { not: "CANCELLED" } },
    _sum: { totalPrice: true },
  });

  const stats = [
    { label: "All bookings", value: allCount.toLocaleString(), tint: "bg-sky-50 text-sky-700", status: "" },
    { label: "Awaiting confirmation", value: countFor("PENDING").toLocaleString(), tint: "bg-amber-50 text-amber-700", status: "PENDING" },
    { label: "Confirmed", value: countFor("CONFIRMED").toLocaleString(), tint: "bg-emerald-50 text-emerald-700", status: "CONFIRMED" },
    {
      label: status === "CANCELLED" ? "Value cancelled" : "Booking value",
      value: `Nu. ${Math.round(Number(value._sum.totalPrice ?? 0)).toLocaleString("en-IN")}`,
      tint: "bg-violet-50 text-violet-700",
      status: null,
    },
  ];

  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (query) params.set("q", query);
  if (page > 1) params.set("page", String(page));

  const dateFmt: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", timeZone: "UTC" };

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
          <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            Bookings
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-stone-700 sm:text-base">
            Every guide, hotel, vehicle, flight and package booking, newest first.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Summary">
        {stats.map((c) => {
          const body = (
            <>
              <p className="text-sm font-medium text-stone-600">{c.label}</p>
              <p className="mt-1 whitespace-nowrap font-display text-2xl font-bold text-stone-900 xl:text-[1.65rem] 2xl:text-3xl">{c.value}</p>
            </>
          );
          const cls =
            "rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 " +
            (c.status === null ? "" : "transition-shadow hover:shadow-md");
          return c.status === null ? (
            <div key={c.label} className={cls}>
              {body}
              <p className="mt-0.5 text-xs text-stone-500">{status ? "for this filter" : "excluding cancelled"}</p>
            </div>
          ) : (
            <Link key={c.label} href={c.status ? `?status=${c.status}` : "?"} className={cls}>
              {body}
              <p className="mt-0.5 text-xs text-stone-500">{c.status ? "show these" : "show all"}</p>
            </Link>
          );
        })}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
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

        {bookings.length === 0 ? (
          <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            {query || status
              ? "No bookings match that. Try clearing the search or the status filter."
              : "No bookings yet."}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {bookings.map((b) => (
              <li key={b.id}>
                <Link
                  href={`/chim/bookings/${b.id}`}
                  className="-mx-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl px-2 py-3.5 hover:bg-stone-50"
                >
                  <span
                    aria-hidden
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#fcf6e9] text-sm font-semibold text-brand-900"
                  >
                    {initials(b.traveler.name)}
                  </span>
                  <span className="min-w-0 flex-1 basis-52">
                    <span className="block truncate text-sm font-semibold text-stone-900">{b.traveler.name}</span>
                    <span className="block truncate text-xs text-stone-500">{vendorLabel(b)}</span>
                  </span>
                  <span className="hidden font-mono text-xs text-stone-500 md:block">{b.reference}</span>
                  <span className="text-xs text-stone-500">
                    {b.startDate.toLocaleDateString("en-GB", dateFmt)} →{" "}
                    {b.endDate.toLocaleDateString("en-GB", { ...dateFmt, year: "numeric" })}
                  </span>
                  <StatusBadge status={b.status} />
                  <span className="w-28 text-right text-sm font-semibold text-stone-900">
                    Nu. {Number(b.totalPrice).toLocaleString("en-IN")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Pager page={page} pageSize={PAGE_SIZE} total={total} params={params} />
      </section>
    </div>
  );
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "?") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
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
