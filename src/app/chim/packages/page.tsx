import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DeletePackageButton from "@/components/admin/DeletePackageButton";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-pending",
  PUBLISHED: "badge-approved",
  ARCHIVED: "badge-suspended",
};

export default async function AdminPackagesPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const itineraries = await prisma.itinerary.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true, days: true } } },
  });

  const count = (st: string) => itineraries.filter((i) => i.status === st).length;
  const stats = [
    { label: "All packages", value: itineraries.length },
    { label: "Published", value: count("PUBLISHED") },
    { label: "Drafts", value: count("DRAFT") },
    { label: "Archived", value: count("ARCHIVED") },
  ];

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
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-7 sm:px-8 sm:py-9">
          <div>
            <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
              Package tours
            </h1>
            <p className="mt-1.5 max-w-md text-sm text-stone-700 sm:text-base">
              Create, edit and schedule the tours travelers can book.
            </p>
          </div>
          <Link href="/chim/packages/new" className="btn-primary">
            + New package
          </Link>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Summary">
        {stats.map((c) => (
          <div key={c.label} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        {itineraries.length === 0 ? (
          <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">No packages yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {itineraries.map((it) => (
              <li key={it.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <span className="relative h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-stone-100">
                    {it.coverPhotoUrl && (
                      // Admin-entered address from any host; next/image would want each allow-listed.
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={it.coverPhotoUrl} alt="" className="h-full w-full object-cover" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="font-medium">
                      {it.title} <span className={STATUS_BADGE[it.status] ?? "badge"}>{it.status}</span>
                    </p>
                    <p className="text-sm text-stone-500">
                      {it.durationDays} days · Nu. {Number(it.pricePerPerson).toLocaleString()}/person ·{" "}
                      {it._count.days} day{it._count.days === 1 ? "" : "s"} planned · {it._count.bookings} booking
                      {it._count.bookings === 1 ? "" : "s"}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Link href={`/chim/packages/${it.id}/departures`} className="btn-secondary">
                    Dates
                  </Link>
                  <Link href={`/chim/packages/${it.id}/edit`} className="btn-secondary">
                    Edit
                  </Link>
                  <DeletePackageButton
                    itineraryId={it.id}
                    title={it.title}
                    bookingCount={it._count.bookings}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
