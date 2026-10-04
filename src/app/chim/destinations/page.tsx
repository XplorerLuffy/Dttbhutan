import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DestinationRegionSelect from "@/components/admin/DestinationRegionSelect";

export default async function AdminDestinationsPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const destinations = await prisma.destination.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Destinations</h1>
      <p className="mb-6 text-sm text-stone-600">
        The 20 dzongkhags. Change a region inline, or edit a destination to change its description,
        highlights and photo — all of which travelers see.
      </p>

      <div className="space-y-2">
        {destinations.map((d) => (
          <div key={d.id} className="card flex flex-wrap items-center gap-x-4 gap-y-3">
            {d.photoUrl ? (
              // Photo URLs are admin-entered and may point at hosts outside the
              // next.config image allowlist, which next/image rejects.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={d.photoUrl}
                alt=""
                className="h-12 w-20 shrink-0 rounded object-cover"
              />
            ) : (
              <div className="flex h-12 w-20 shrink-0 items-center justify-center rounded bg-stone-100 text-[10px] text-stone-400">
                No photo
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-medium">{d.name}</p>
              <p className="truncate text-xs text-stone-500">
                {d.description ? d.description : "No description yet"}
              </p>
            </div>

            <DestinationRegionSelect destinationId={d.id} region={d.region} />
            <Link href={`/chim/destinations/${d.id}/edit`} className="btn-secondary shrink-0">
              Edit
            </Link>
          </div>
        ))}
        {destinations.length === 0 && <p className="text-sm text-stone-500">No destinations yet.</p>}
      </div>
    </div>
  );
}
