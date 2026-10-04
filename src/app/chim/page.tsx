import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAdminWorkload } from "@/lib/admin/workload";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

/**
 * The overview, rebuilt around the question an admin actually opens it to ask:
 * what needs me today?
 *
 * It used to be six identical cards, so nine bookings awaiting confirmation
 * looked exactly like zero flagged trips and you had to read every number to
 * find the one that mattered. Now the queues with work in them come first and
 * alone, the rest are a quiet row of links underneath, and the newest items in
 * each queue are listed — so the common jobs can be started from here rather
 * than found by navigating.
 */
export default async function AdminHomePage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const [work, recentBookings, recentEnquiries, recentCustomTours] = await Promise.all([
    getAdminWorkload(),
    prisma.booking.findMany({
      where: { status: "PENDING" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { traveler: { select: { name: true } } },
    }),
    prisma.contactMessage.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.customTourRequest.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { traveler: { select: { name: true } } },
    }),
  ]);

  const queues = [
    {
      href: "/chim/bookings?status=PENDING",
      label: "Bookings to confirm",
      count: work.bookings,
    },
    { href: "/chim/enquiries", label: "Unread enquiries", count: work.enquiries },
    { href: "/chim/custom-tours", label: "New custom tour requests", count: work.customTours },
    { href: "/chim/vendors", label: "Vendors awaiting approval", count: work.vendors },
    { href: "/chim/gps/trips", label: "Mileage reports flagged", count: work.flaggedTrips },
  ].filter((q) => q.count > 0);

  const elsewhere = [
    { href: "/chim/packages", label: "Package tours" },
    { href: "/chim/destinations", label: "Destinations" },
    { href: "/chim/travel-guide", label: "Travel guide" },
    { href: "/chim/content", label: "Site content" },
    { href: "/chim/knowledge", label: "DRUKA knowledge" },
    { href: "/chim/exchange-rates", label: "Exchange rates" },
  ];

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">Admin dashboard</h1>
        <p className="mt-1 text-sm text-stone-600">
          Signed in as {user.name} ({user.email}).
        </p>
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
          Needs your attention
        </h2>

        {queues.length === 0 ? (
          <div className="rounded-xl border border-green-200 bg-green-50 px-5 py-6">
            <p className="font-display text-lg font-semibold text-green-900">All clear</p>
            <p className="mt-1 text-sm text-green-800">
              No bookings waiting on confirmation, no unread enquiries, no vendors to approve.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {queues.map((q) => (
              <Link
                key={q.href}
                href={q.href}
                className="rounded-xl border border-brand-200 bg-brand-50/60 px-5 py-4 transition-shadow hover:shadow-md"
              >
                <p className="font-display text-3xl font-bold text-brand-800">{q.count}</p>
                <p className="mt-1 text-sm font-medium text-brand-900">{q.label}</p>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <Queue
          title="Bookings to confirm"
          href="/chim/bookings?status=PENDING"
          empty="Nothing waiting on confirmation."
          rows={recentBookings.map((b) => ({
            key: b.id,
            href: `/dashboard/bookings/${b.id}`,
            primary: b.traveler.name,
            secondary: `${b.reference} · ${b.startDate.toDateString()} · Nu. ${Number(
              b.totalPrice
            ).toLocaleString()}`,
            badge: <StatusBadge status={b.status} />,
          }))}
        />

        <Queue
          title="Unread enquiries"
          href="/chim/enquiries"
          empty="No unread enquiries."
          rows={recentEnquiries.map((m) => ({
            key: m.id,
            href: "/chim/enquiries",
            primary: m.name,
            secondary: m.subject ?? m.message.slice(0, 80),
          }))}
        />

        <Queue
          title="New custom tour requests"
          href="/chim/custom-tours"
          empty="No new requests."
          rows={recentCustomTours.map((r) => ({
            key: r.id,
            href: "/chim/custom-tours",
            primary: r.traveler.name,
            secondary: `${r.travelers} traveller${r.travelers === 1 ? "" : "s"} · ${r.startDate.toDateString()} → ${r.endDate.toDateString()}`,
          }))}
        />

        <section>
          <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">Everything else</h2>
          <div className="grid grid-cols-2 gap-2">
            {elsewhere.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:border-stone-300 hover:text-stone-900"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

/** One queue's newest few, or a line saying it is empty. */
function Queue({
  title,
  href,
  empty,
  rows,
}: {
  title: string;
  href: string;
  empty: string;
  rows: {
    key: string;
    href: string;
    primary: string;
    secondary: string;
    badge?: React.ReactNode;
  }[];
}) {
  return (
    <section>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-stone-900">{title}</h2>
        {rows.length > 0 && (
          <Link href={href} className="text-sm font-semibold text-brand-700 hover:underline">
            See all
          </Link>
        )}
      </div>

      {rows.length === 0 ? (
        <p className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-500">
          {empty}
        </p>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-lg border border-stone-200 bg-white">
          {rows.map((row) => (
            <li key={row.key}>
              <Link
                href={row.href}
                className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-stone-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-stone-900">
                    {row.primary}
                  </span>
                  <span className="block truncate text-xs text-stone-500">{row.secondary}</span>
                </span>
                {row.badge}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
