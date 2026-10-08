import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DestinationRegionSelect from "@/components/admin/DestinationRegionSelect";

export default async function AdminDestinationsPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const destinations = await prisma.destination.findMany({ orderBy: { name: "asc" } });

  const noPhoto = destinations.filter((d) => !d.photoUrl).length;
  const noText = destinations.filter((d) => !d.description).length;
  const stats = [
    { label: "Destinations", value: destinations.length, warn: false },
    { label: "Regions", value: new Set(destinations.map((d) => d.region)).size, warn: false },
    { label: "Missing a photo", value: noPhoto, warn: noPhoto > 0 },
    { label: "Missing a description", value: noText, warn: noText > 0 },
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
            Destinations
          </h1>
          <p className="mt-1.5 max-w-xl text-sm text-stone-700 sm:text-base">
            The 20 dzongkhags. Change a region inline, or edit a destination to change its
            description, highlights and photo — all of which travelers see.
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4" aria-label="Summary">
        {stats.map((c) => (
          <div
            key={c.label}
            className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
              c.warn ? "border-amber-200 bg-amber-50" : "border-stone-200 bg-white"
            }`}
          >
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">{c.value}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        {destinations.length === 0 ? (
          <p className="rounded-xl bg-stone-50 px-4 py-8 text-center text-sm text-stone-500">No destinations yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {destinations.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 py-3.5 first:pt-0 last:pb-0">
                {d.photoUrl ? (
                  // Photo URLs are admin-entered and may point at hosts outside the
                  // next.config image allowlist, which next/image rejects.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={d.photoUrl} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-20 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-[10px] text-stone-400">
                    No photo
                  </div>
                )}

                <div className="min-w-0 flex-1 basis-48">
                  <p className="font-medium">{d.name}</p>
                  <p className="truncate text-xs text-stone-500">
                    {d.description ? d.description : "No description yet"}
                  </p>
                </div>

                <DestinationRegionSelect destinationId={d.id} region={d.region} />
                <Link href={`/chim/destinations/${d.id}/edit`} className="btn-secondary shrink-0">
                  Edit
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
