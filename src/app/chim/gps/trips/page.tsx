import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";

export const dynamic = "force-dynamic";

export default async function AdminGpsTripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const sp = await searchParams;
  const raw = (Array.isArray(sp.show) ? sp.show[0] : sp.show) ?? "";
  const filter = ["flagged", "active", "done"].includes(raw) ? raw : "";

  const all = await prisma.trip.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      vehicle: { include: { operator: true } },
      booking: { include: { traveler: true } },
      report: true,
    },
  });

  const flaggedCount = all.filter((t) => t.report?.flagged).length;
  const activeCount = all.filter((t) => t.status === "IN_PROGRESS").length;
  const doneCount = all.filter((t) => t.status === "COMPLETED").length;
  const trips = all.filter((t) =>
    filter === "flagged"
      ? t.report?.flagged
      : filter === "active"
        ? t.status === "IN_PROGRESS"
        : filter === "done"
          ? t.status === "COMPLETED"
          : true
  );
  const tabs = [
    { value: "", label: "All", count: all.length },
    { value: "flagged", label: "Flagged", count: flaggedCount },
    { value: "active", label: "In progress", count: activeCount },
    { value: "done", label: "Completed", count: doneCount },
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
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          <h1 data-hero className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl">
            GPS mileage reports
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-stone-700 sm:text-base">
            Planned vs. GPS-verified distance for every vehicle trip. Flagged trips deviate from the
            quoted route by more than the configured threshold and are the ones worth pulling up for
            a driver/client dispute.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Summary">
        {tabs.map((c) => (
          <Link
            key={c.label}
            href={c.value ? `?show=${c.value}` : "?"}
            className={`rounded-2xl border p-4 shadow-sm transition-shadow hover:shadow-md sm:p-5 ${
              c.value === "flagged" && c.count > 0 ? "border-red-200 bg-red-50" : "border-stone-200 bg-white"
            }`}
          >
            <p className="text-sm font-medium text-stone-600">{c.value ? c.label : "All trips"}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{c.count}</p>
            <p className="mt-0.5 text-xs text-stone-500">{c.value ? "show these" : "show all"}</p>
          </Link>
        ))}
      </section>

      <div className="flex flex-wrap gap-1.5">
        {tabs.map((t) => {
          const on = t.value === filter;
          return (
            <Link
              key={t.value || "all"}
              href={t.value ? `?show=${t.value}` : "?"}
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

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        {trips.length === 0 ? (
          <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">
            {filter ? "No trips match that." : "No trips yet."}
          </p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {trips.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/chim/gps/trips/${t.id}`}
                  className="-mx-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl px-2 py-3.5 hover:bg-stone-50"
                >
                  <span className="min-w-0 flex-1 basis-64">
                    <span className="block text-sm font-semibold text-stone-900">
                      {t.vehicle.operator.businessName} · {t.vehicle.type} — {t.booking.traveler.name}
                    </span>
                    <span className="block text-xs text-stone-500">
                      Planned {t.plannedDistanceKm} km
                      {t.report && ` · Actual ${t.report.actualDistanceKm.toFixed(1)} km`}
                    </span>
                  </span>
                  <span className="flex items-center gap-2">
                    {t.report?.flagged && <span className="badge bg-red-100 text-red-800">Flagged</span>}
                    <StatusBadge status={t.status} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
