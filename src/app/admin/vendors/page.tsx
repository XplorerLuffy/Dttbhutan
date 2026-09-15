import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import StatusBadge from "@/components/StatusBadge";
import VendorApprovalControls from "@/components/admin/VendorApprovalControls";

export default async function AdminVendorsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const [guides, hotels, operators] = await Promise.all([
    prisma.guideProfile.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } }),
    prisma.hotel.findMany({ include: { owner: true, destination: true }, orderBy: { createdAt: "desc" } }),
    prisma.transportOperator.findMany({
      include: { owner: true, vehicles: true },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-bold">Vendor approvals</h1>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Tour guides</h2>
        <div className="space-y-3">
          {guides.map((g) => (
            <div key={g.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {g.user.name} <StatusBadge status={g.status} />
                </p>
                <p className="text-sm text-stone-500">
                  TCB license {g.licenseNumber} · {g.languages.join(", ")}
                </p>
                {g.adminNote && (
                  <p className="text-xs text-stone-400">Note: {g.adminNote}</p>
                )}
              </div>
              <VendorApprovalControls apiPath={`/api/admin/guides/${g.id}`} />
            </div>
          ))}
          {guides.length === 0 && <p className="text-sm text-stone-500">No guides yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Hotels</h2>
        <div className="space-y-3">
          {hotels.map((h) => (
            <div key={h.id} className="card flex items-center justify-between">
              <div>
                <p className="font-medium">
                  {h.name} <StatusBadge status={h.status} />
                </p>
                <p className="text-sm text-stone-500">
                  {h.destination.name} · owner: {h.owner.name}
                </p>
                {h.adminNote && (
                  <p className="text-xs text-stone-400">Note: {h.adminNote}</p>
                )}
              </div>
              <VendorApprovalControls apiPath={`/api/admin/hotels/${h.id}`} />
            </div>
          ))}
          {hotels.length === 0 && <p className="text-sm text-stone-500">No hotels yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Transport operators & vehicles</h2>
        <div className="space-y-3">
          {operators.map((op) => (
            <div key={op.id} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {op.businessName} <StatusBadge status={op.status} />
                  </p>
                  <p className="text-sm text-stone-500">Owner: {op.owner.name}</p>
                  {op.adminNote && (
                    <p className="text-xs text-stone-400">Note: {op.adminNote}</p>
                  )}
                </div>
                <VendorApprovalControls apiPath={`/api/admin/transport/${op.id}`} />
              </div>
              {op.vehicles.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-stone-100 pt-3">
                  {op.vehicles.map((v) => (
                    <div key={v.id} className="flex items-center justify-between text-sm">
                      <span>
                        {v.type} · {v.plateNumber} <StatusBadge status={v.status} />
                      </span>
                      <VendorApprovalControls apiPath={`/api/admin/vehicles/${v.id}`} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          {operators.length === 0 && (
            <p className="text-sm text-stone-500">No transport operators yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
