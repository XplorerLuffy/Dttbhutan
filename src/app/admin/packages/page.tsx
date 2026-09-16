import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import DeletePackageButton from "@/components/admin/DeletePackageButton";

const STATUS_BADGE: Record<string, string> = {
  DRAFT: "badge-pending",
  PUBLISHED: "badge-approved",
  ARCHIVED: "badge-suspended",
};

export default async function AdminPackagesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const itineraries = await prisma.itinerary.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { bookings: true, days: true } } },
  });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Package tours</h1>
        <Link href="/admin/packages/new" className="btn-primary">
          + New package
        </Link>
      </div>

      <div className="space-y-3">
        {itineraries.map((it) => (
          <div key={it.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            <div className="flex shrink-0 items-center gap-2">
              <Link href={`/admin/packages/${it.id}/edit`} className="btn-secondary">
                Edit
              </Link>
              <DeletePackageButton
                itineraryId={it.id}
                title={it.title}
                bookingCount={it._count.bookings}
              />
            </div>
          </div>
        ))}
        {itineraries.length === 0 && <p className="text-sm text-stone-500">No packages yet.</p>}
      </div>
    </div>
  );
}
