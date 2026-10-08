import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminWorkload } from "@/lib/admin/workload";
import StatusBadge from "@/components/StatusBadge";
import { AreaChart, Donut, Sparkline } from "@/components/admin/charts";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;
const BT_OFFSET = 6 * 60 * 60 * 1000; // Bhutan is UTC+6, all year

/** Calendar day in Bhutan time, as YYYY-MM-DD. */
const btDay = (d: Date) => new Date(d.getTime() + BT_OFFSET).toISOString().slice(0, 10);

const CATEGORY_LABEL: Record<string, string> = {
  CULTURAL: "Cultural tours",
  TREKKING: "Trekking",
  WILDLIFE: "Wildlife",
  HONEYMOON: "Honeymoon & retreats",
};
const TYPE_LABEL: Record<string, string> = {
  GUIDE: "Guides",
  HOTEL: "Hotels",
  VEHICLE: "Transport",
  FLIGHT: "Flights",
};
const SLICE_COLORS = ["#e8b13a", "#10a56f", "#2f8fe6", "#7c5ce0", "#9ca3af", "#e0674a"];

/**
 * The overview: what needs doing, then how the business is moving.
 *
 * Everything on it is counted from the agency's own bookings, enquiries and
 * departures — nothing is estimated or filled in for show. A figure with no
 * history to compare against says so instead of printing a percentage.
 */
export default async function AdminHomePage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const { range: rangeParam } = await searchParams;
  const range = [7, 30, 90].includes(Number(rangeParam)) ? Number(rangeParam) : 30;

  const now = new Date();
  const today = btDay(now);
  const since = new Date(now.getTime() - 120 * DAY);
  const monthStartUtc = new Date(`${today.slice(0, 8)}01T00:00:00Z`);
  const monthEndUtc = new Date(Date.UTC(monthStartUtc.getUTCFullYear(), monthStartUtc.getUTCMonth() + 1, 1));

  const [work, bookings, enquiries, customTours, recent, departures, monthDepartures, monthStarts] =
    await Promise.all([
      getAdminWorkload(),
      prisma.booking.findMany({
        where: { createdAt: { gte: since } },
        select: {
          createdAt: true,
          status: true,
          type: true,
          totalPrice: true,
          itineraryBooking: { select: { itinerary: { select: { category: true } } } },
        },
      }),
      prisma.contactMessage.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.customTourRequest.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      prisma.booking.findMany({
        orderBy: { createdAt: "desc" },
        take: 6,
        include: {
          traveler: { select: { name: true } },
          guide: { include: { user: { select: { name: true } } } },
          roomType: { include: { hotel: { select: { name: true } } } },
          vehicle: { include: { operator: { select: { businessName: true } } } },
          flightBooking: { select: { origin: true, destination: true } },
          itineraryBooking: { include: { itinerary: { select: { title: true } } } },
        },
      }),
      prisma.departure.findMany({
        where: { startDate: { gte: new Date(`${today}T00:00:00Z`) }, status: { not: "CANCELLED" } },
        orderBy: { startDate: "asc" },
        take: 5,
        include: { itinerary: { select: { title: true, coverPhotoUrl: true, durationDays: true } } },
      }),
      prisma.departure.findMany({
        where: { startDate: { gte: monthStartUtc, lt: monthEndUtc }, status: { not: "CANCELLED" } },
        select: { startDate: true },
      }),
      prisma.booking.findMany({
        where: { startDate: { gte: monthStartUtc, lt: monthEndUtc }, status: { not: "CANCELLED" } },
        select: { startDate: true },
      }),
    ]);

  // --- bucket everything by Bhutan calendar day ---
  const dayKeys = (n: number) =>
    Array.from({ length: n }, (_, i) => btDay(new Date(now.getTime() - (n - 1 - i) * DAY)));
  const counts = (dates: Date[]) => {
    const m = new Map<string, number>();
    for (const d of dates) m.set(btDay(d), (m.get(btDay(d)) ?? 0) + 1);
    return m;
  };
  const sums = (rows: { createdAt: Date; totalPrice: unknown }[]) => {
    const m = new Map<string, number>();
    for (const r of rows) m.set(btDay(r.createdAt), (m.get(btDay(r.createdAt)) ?? 0) + Number(r.totalPrice));
    return m;
  };

  const live = bookings.filter((b) => b.status !== "CANCELLED");
  const earned = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "COMPLETED");
  const series = (map: Map<string, number>, n: number) => dayKeys(n).map((k) => map.get(k) ?? 0);

  const windowTotal = (map: Map<string, number>, from: number, to: number) =>
    Array.from({ length: to - from }, (_, i) => btDay(new Date(now.getTime() - (from + i) * DAY))).reduce(
      (s, k) => s + (map.get(k) ?? 0),
      0
    );
  const change = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

  const bookingDays = counts(live.map((b) => b.createdAt));
  const enquiryDays = counts(enquiries.map((e) => e.createdAt));
  const customDays = counts(customTours.map((c) => c.createdAt));
  const revenueDays = sums(earned);

  const cards = [
    { label: "Bookings", map: bookingDays, color: "#c58a1c", tint: "bg-amber-50 text-amber-700", href: "/chim/bookings", money: false },
    { label: "New enquiries", map: enquiryDays, color: "#2f8fe6", tint: "bg-sky-50 text-sky-700", href: "/chim/enquiries", money: false },
    { label: "Revenue", map: revenueDays, color: "#10a56f", tint: "bg-emerald-50 text-emerald-700", href: "/chim/bookings", money: true },
    { label: "Custom tour requests", map: customDays, color: "#7c5ce0", tint: "bg-violet-50 text-violet-700", href: "/chim/custom-tours", money: false },
  ].map((c) => {
    const cur = windowTotal(c.map, 0, 30);
    const prev = windowTotal(c.map, 30, 60);
    return { ...c, cur, change: change(cur, prev), spark: series(c.map, 30) };
  });

  // --- main chart + donut ---
  const rangeKeys = dayKeys(range);
  const chartValues = rangeKeys.map((k) => bookingDays.get(k) ?? 0);
  const chartLabels = rangeKeys.map((k) => new Date(`${k}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }));
  const inRange = new Set(rangeKeys);
  const typeCounts = new Map<string, number>();
  for (const b of live) {
    if (!inRange.has(btDay(b.createdAt))) continue;
    const label =
      b.type === "ITINERARY"
        ? CATEGORY_LABEL[b.itineraryBooking?.itinerary.category ?? ""] ?? "Packages"
        : TYPE_LABEL[b.type] ?? "Other";
    typeCounts.set(label, (typeCounts.get(label) ?? 0) + 1);
  }
  const slices = Array.from(typeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([label, value], i) => ({ label, value, color: SLICE_COLORS[i % SLICE_COLORS.length] }));
  const sliceTotal = slices.reduce((s, x) => s + x.value, 0);

  // --- needs attention ---
  const queues = [
    { href: "/chim/bookings?status=PENDING", label: "Bookings to confirm", count: work.bookings },
    { href: "/chim/enquiries", label: "Unread enquiries", count: work.enquiries },
    { href: "/chim/custom-tours", label: "New custom tour requests", count: work.customTours },
    { href: "/chim/vendors", label: "Applications & vendors to approve", count: work.vendors },
    { href: "/chim/gps/trips", label: "Mileage reports flagged", count: work.flaggedTrips },
  ].filter((q) => q.count > 0);

  // --- calendar ---
  const [yy, mm] = today.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const firstWeekday = (monthStartUtc.getUTCDay() + 6) % 7; // Monday first
  const departDays = new Set(monthDepartures.map((d) => d.startDate.toISOString().slice(0, 10)));
  const startDays = new Set(monthStarts.map((d) => btDay(d.startDate)));
  const hour = Number(new Date(now.getTime() + BT_OFFSET).toISOString().slice(11, 13));
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const first = user.name.trim().split(/\s+/)[0];

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          priority
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="-z-10 object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="px-5 py-8 sm:px-8 sm:py-10">
          <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            {greeting}, {first}
          </h1>
          <p className="mt-1.5 max-w-md text-sm text-stone-700 sm:text-base">
            Here&apos;s what&apos;s happening with your travel agency today.
          </p>
        </div>
      </section>

      {/* Needs attention */}
      <section aria-labelledby="attention">
        <h2 id="attention" className="sr-only">
          Needs your attention
        </h2>
        {queues.length === 0 ? (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-4">
            <p className="font-display text-lg font-semibold text-emerald-900">All clear</p>
            <p className="text-sm text-emerald-800">
              No bookings waiting on confirmation, no unread enquiries, nobody to approve.
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-3">
            {queues.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="flex min-h-[3.25rem] items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-950 transition-shadow hover:shadow-md"
              >
                <span className="font-display text-2xl font-bold text-amber-800">{q.count}</span>
                {q.label}
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Stat cards */}
      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Last 30 days">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5"
          >
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              {c.money ? `Nu. ${Math.round(c.cur).toLocaleString("en-IN")}` : c.cur.toLocaleString()}
            </p>
            <p className="mt-0.5 text-xs text-stone-500">
              {c.change === null ? (
                "last 30 days"
              ) : (
                <>
                  <span className={c.change >= 0 ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
                    {c.change >= 0 ? "↑" : "↓"} {Math.abs(c.change)}%
                  </span>{" "}
                  vs previous 30 days
                </>
              )}
            </p>
            <div className="mt-3">
              <Sparkline values={c.spark} color={c.color} />
            </div>
          </Link>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <div className="min-w-0 space-y-6">
          {/* Bookings overview + trip types */}
          <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <section className="min-w-0 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-semibold">Bookings overview</h2>
                <div className="flex rounded-lg border border-stone-200 p-0.5 text-xs font-medium" role="group" aria-label="Date range">
                  {[7, 30, 90].map((r) => (
                    <Link
                      key={r}
                      href={r === 30 ? "/chim" : `/chim?range=${r}`}
                      aria-current={r === range ? "true" : undefined}
                      className={`flex min-h-[2.5rem] items-center rounded-md px-3.5 sm:min-h-0 sm:py-1.5 ${r === range ? "bg-brand-900 text-white" : "text-stone-600 hover:bg-stone-100"}`}
                    >
                      {r} days
                    </Link>
                  ))}
                </div>
              </div>
              <AreaChart labels={chartLabels} values={chartValues} />
            </section>

            <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="font-display text-lg font-semibold">Trip types</h2>
              <p className="text-xs text-stone-500">Bookings in the last {range} days</p>
              {sliceTotal === 0 ? (
                <p className="mt-6 text-sm text-stone-500">No bookings in this period yet.</p>
              ) : (
                <div className="mt-3 flex flex-col items-center gap-4 sm:flex-row lg:flex-col xl:flex-row">
                  <Donut slices={slices} total={sliceTotal} centerLabel="Bookings" />
                  <ul className="w-full space-y-2 text-sm">
                    {slices.map((s) => (
                      <li key={s.label} className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
                        <span className="flex-1 text-stone-700">{s.label}</span>
                        <span className="font-medium text-stone-900">{Math.round((s.value / sliceTotal) * 100)}%</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          {/* Recent bookings */}
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold">Recent bookings</h2>
              <Link href="/chim/bookings" className="text-sm font-semibold text-brand-700 hover:underline">
                View all →
              </Link>
            </div>
            {recent.length === 0 ? (
              <p className="text-sm text-stone-500">No bookings yet.</p>
            ) : (
              <ul className="divide-y divide-stone-100">
                {recent.map((b) => (
                  <li key={b.id}>
                    <Link
                      href={`/chim/bookings/${b.id}`}
                      className="-mx-2 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-lg px-2 py-3 hover:bg-stone-50"
                    >
                      <span className="min-w-0 flex-1 basis-48">
                        <span className="block truncate text-sm font-semibold text-stone-900">{b.traveler.name}</span>
                        <span className="block truncate text-xs text-stone-500">{bookingTitle(b)}</span>
                      </span>
                      <span className="text-xs text-stone-500">
                        {b.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
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
          </section>
        </div>

        {/* Right column */}
        <div className="min-w-0 space-y-6">
          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="mb-3 font-display text-lg font-semibold">Upcoming departures</h2>
            {departures.length === 0 ? (
              <p className="text-sm text-stone-500">No upcoming departures are scheduled.</p>
            ) : (
              <ul className="space-y-3">
                {departures.map((d) => (
                  <li key={d.id} className="flex items-center gap-3">
                    <span className="relative h-14 w-16 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                      {d.itinerary.coverPhotoUrl && (
                        // Admin-entered address from any host; next/image would want each allow-listed.
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.itinerary.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-stone-900">{d.itinerary.title}</span>
                      <span className="block text-xs text-stone-500">
                        {d.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })} –{" "}
                        {d.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}
                      </span>
                    </span>
                    <StatusBadge status={d.status} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <h2 className="font-display text-lg font-semibold">
              {new Date(Date.UTC(yy, mm - 1, 1)).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" })}
            </h2>
            <div className="mt-3 grid grid-cols-7 gap-y-1 text-center text-xs">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <span key={d} className="pb-1 font-medium text-stone-500">
                  {d}
                </span>
              ))}
              {Array.from({ length: firstWeekday }).map((_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((n) => {
                const key = `${today.slice(0, 8)}${String(n).padStart(2, "0")}`;
                const isToday = key === today;
                return (
                  <span key={n} className="flex flex-col items-center py-1">
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-sm ${isToday ? "bg-brand-900 font-semibold text-white" : "text-stone-800"}`}
                    >
                      {n}
                    </span>
                    <span className="mt-0.5 flex h-1.5 gap-0.5">
                      {departDays.has(key) && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      {startDays.has(key) && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                    </span>
                  </span>
                );
              })}
            </div>
            <p className="mt-2 flex gap-4 text-xs text-stone-500">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-amber-500" /> Departure
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" /> Trip starts
              </span>
            </p>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-[#fcf6e9] p-4 sm:p-5">
            <h2 className="font-display text-lg font-semibold">Quick links</h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                { href: "/chim/packages", label: "Package tours" },
                { href: "/chim/destinations", label: "Destinations" },
                { href: "/chim/travel-guide", label: "Travel guide" },
                { href: "/chim/content", label: "Site content" },
                { href: "/chim/knowledge", label: "DRUKA knowledge" },
                { href: "/chim/exchange-rates", label: "Exchange rates" },
              ].map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="flex min-h-[2.75rem] items-center rounded-xl border border-stone-200 bg-white px-3 text-sm font-medium text-stone-700 hover:border-stone-300 hover:text-stone-900"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function bookingTitle(b: {
  type: string;
  guide: { user: { name: string } } | null;
  roomType: { name: string; hotel: { name: string } } | null;
  vehicle: { type: string; operator: { businessName: string } } | null;
  flightBooking: { origin: string; destination: string } | null;
  itineraryBooking: { itinerary: { title: string } } | null;
}) {
  if (b.type === "GUIDE") return `Guide: ${b.guide?.user.name ?? "—"}`;
  if (b.type === "HOTEL") return `Hotel: ${b.roomType?.hotel.name ?? "—"}`;
  if (b.type === "FLIGHT") return `Flight: ${b.flightBooking?.origin} → ${b.flightBooking?.destination}`;
  if (b.type === "ITINERARY") return b.itineraryBooking?.itinerary.title ?? "Package";
  return `Transport: ${b.vehicle?.operator.businessName ?? "—"}`;
}
