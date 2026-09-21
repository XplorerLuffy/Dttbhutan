import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import DestinationRegionSelect from "@/components/admin/DestinationRegionSelect";

export default async function AdminDestinationsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const destinations = await prisma.destination.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Destinations</h1>
      <p className="mb-6 text-sm text-stone-600">
        Assign each dzongkhag to a region. This doesn&apos;t affect the public site yet — it&apos;s
        recorded for future use.
      </p>

      <div className="space-y-2">
        {destinations.map((d) => (
          <div key={d.id} className="card flex items-center justify-between gap-4">
            <span className="font-medium">{d.name}</span>
            <DestinationRegionSelect destinationId={d.id} region={d.region} />
          </div>
        ))}
        {destinations.length === 0 && <p className="text-sm text-stone-500">No destinations yet.</p>}
      </div>
    </div>
  );
}
