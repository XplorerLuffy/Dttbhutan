import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CustomTourRequestControls from "@/components/admin/CustomTourRequestControls";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

const STATUSES = [
  { value: "NEW", label: "New" },
  { value: "IN_REVIEW", label: "In review" },
  { value: "QUOTED", label: "Quoted" },
  { value: "CLOSED", label: "Closed" },
];

export default async function AdminCustomToursPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const sp = await searchParams;
  const raw = (Array.isArray(sp.status) ? sp.status[0] : sp.status)?.toUpperCase() ?? "";
  const filter = STATUSES.some((x) => x.value === raw) ? raw : "";

  const all = await prisma.customTourRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      traveler: true,
      destinations: true,
      guide: { include: { user: { select: { name: true } } } },
      roomType: { include: { hotel: { select: { name: true } } } },
      vehicle: { include: { operator: { select: { businessName: true } } } },
    },
  });

  const countOf = (st: string) => all.filter((r) => r.status === st).length;
  const requests = filter ? all.filter((r) => r.status === filter) : all;
  const tabs = [{ value: "", label: "All", count: all.length }, ...STATUSES.map((x) => ({ ...x, count: countOf(x.value) }))];

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
            Custom tour requests
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-stone-700 sm:text-base">
            Inquiries with no fixed itinerary yet — follow up with the traveler directly
            (email/phone below) to put together a quote.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Summary">
        {tabs.slice(1).map((c) => (
          <Link
            key={c.value}
            href={`?status=${c.value}`}
            className={`rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 ${
              c.value === "NEW" && c.count > 0 ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-white"
            }`}
          >
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{c.count}</p>
            <p className="mt-0.5 text-xs text-stone-500">show these</p>
          </Link>
        ))}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const on = t.value === filter;
          return (
            <Link
              key={t.value || "all"}
              href={t.value ? `?status=${t.value}` : "?"}
              aria-current={on ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium ${
                on
                  ? "bg-brand-800 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              {t.label}
              <span className={on ? "ml-1.5 text-white/70" : "ml-1.5 text-stone-400"}>{t.count}</span>
            </Link>
          );
        })}
      </div>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row">
              <div>
                <p className="font-medium">
                  {r.traveler.name} <StatusBadge status={r.status} />
                </p>
                <p className="text-sm text-stone-500">
                  {r.traveler.email}
                  {r.traveler.phone ? ` · ${r.traveler.phone}` : ""}
                </p>
                <p className="mt-2 text-sm text-stone-600">
                  {r.startDate.toDateString()} → {r.endDate.toDateString()} · {r.travelers} traveler
                  {r.travelers > 1 ? "s" : ""}
                  {r.budgetPerPerson && ` · Nu. ${Number(r.budgetPerPerson).toLocaleString()}/person budget`}
                </p>
                <p className="mt-1 text-sm text-stone-500">
                  {r.destinations.map((d) => d.name).join(", ")}
                </p>
                {(r.guide || r.roomType || r.vehicle) && (
                  <div className="mt-2 rounded-md bg-stone-50 p-2 text-sm text-stone-700">
                    {r.guide && <p>Guide: {r.guide.user.name}</p>}
                    {r.roomType && (
                      <p>
                        Hotel: {r.roomType.hotel.name} · {r.roomType.name}
                        {r.roomsNeeded && r.roomsNeeded > 1 ? ` (${r.roomsNeeded} rooms)` : ""}
                      </p>
                    )}
                    {r.vehicle && <p>Vehicle: {r.vehicle.type} · {r.vehicle.operator.businessName}</p>}
                    {r.estimatedTotalPrice != null && (
                      <p className="mt-1 font-medium text-stone-900">
                        Estimated Nu. {Number(r.estimatedTotalPrice).toLocaleString()} total · Nu.{" "}
                        {Number(r.estimatedPricePerPerson).toLocaleString()}/person
                      </p>
                    )}
                  </div>
                )}
                {r.notes && <p className="mt-2 text-sm text-stone-700">&ldquo;{r.notes}&rdquo;</p>}
              </div>
              <CustomTourRequestControls
                requestId={r.id}
                currentStatus={r.status}
                currentAdminNote={r.adminNote}
              />
            </div>
          </div>
        ))}
        {requests.length === 0 && <p className="rounded-2xl border border-stone-200 bg-white px-4 py-8 text-center text-sm text-stone-500">{filter ? "No requests with that status." : "No custom tour requests yet."}</p>}
      </div>
    </div>
  );
}
