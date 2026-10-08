import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import StatusBadge from "@/components/StatusBadge";
import VendorRowActions from "@/components/admin/VendorRowActions";
import GuideLoginAccess from "@/components/admin/GuideLoginAccess";
import { isPlaceholderEmail } from "@/lib/adminVendor";

export default async function AdminVendorsPage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

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
      <div>
        <h1 className="text-2xl font-bold">Vendors</h1>
        <p className="mt-1 text-sm text-stone-600">
          Add guides and hotels you work with, approve or suspend a listing, and edit the details
          travelers see. Changing a status emails the vendor (if they have an email); editing
          details does not.
        </p>
      </div>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Tour guides</h2>
          <Link href="/chim/vendors/guides/new" className="btn-primary">
            + Add guide
          </Link>
        </div>
        <div className="space-y-3">
          {guides.map((g) => (
            <div key={g.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {g.user.name} <StatusBadge status={g.status} />
                </p>
                <p className="text-sm text-stone-500">
                  TCB license {g.licenseNumber} · {g.languages.join(", ")}
                </p>
                {/* Who to reach — an application has no login, so this is the
                    only place the admin sees how to contact the applicant. */}
                {(!isPlaceholderEmail(g.user.email) || g.user.phone) && (
                  <p className="text-xs text-stone-500">
                    {[!isPlaceholderEmail(g.user.email) ? g.user.email : null, g.user.phone]
                      .filter(Boolean)
                      .join(" · ")}
                    {g.status === "PENDING" && ` · applied ${g.createdAt.toDateString().slice(4)}`}
                  </p>
                )}
                {g.adminNote && (
                  <p className="text-xs text-stone-400">Note: {g.adminNote}</p>
                )}
                {g.status !== "REJECTED" && (
                  <div className="mt-1.5">
                    <GuideLoginAccess
                      guideId={g.id}
                      hasLogin={Boolean(g.user.authId)}
                      hasEmail={!isPlaceholderEmail(g.user.email)}
                      status={g.status}
                    />
                  </div>
                )}
              </div>
              <VendorRowActions
                status={g.status}
                apiPath={`/api/admin/guides/${g.id}`}
                editHref={`/chim/vendors/guides/${g.id}/edit`}
                profileHref={`/guides/${g.id}`}
              />
            </div>
          ))}
          {guides.length === 0 && <p className="text-sm text-stone-500">No guides yet.</p>}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Hotels</h2>
          <Link href="/chim/vendors/hotels/new" className="btn-primary">
            + Add hotel
          </Link>
        </div>
        <div className="space-y-3">
          {hotels.map((h) => (
            <div key={h.id} className="card flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
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
              <VendorRowActions
                status={h.status}
                apiPath={`/api/admin/hotels/${h.id}`}
                editHref={`/chim/vendors/hotels/${h.id}/edit`}
                profileHref={`/hotels/${h.id}`}
              />
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
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <p className="font-medium">
                    {op.businessName} <StatusBadge status={op.status} />
                  </p>
                  <p className="text-sm text-stone-500">Owner: {op.owner.name}</p>
                  {op.adminNote && (
                    <p className="text-xs text-stone-400">Note: {op.adminNote}</p>
                  )}
                </div>
                <VendorRowActions status={op.status} apiPath={`/api/admin/transport/${op.id}`} />
              </div>
              {op.vehicles.length > 0 && (
                <div className="mt-3 space-y-3 border-t border-stone-100 pt-3">
                  {op.vehicles.map((v) => (
                    <div key={v.id} className="flex flex-col gap-2 text-sm sm:flex-row sm:items-center sm:justify-between">
                      <span>
                        {v.type} · {v.plateNumber} <StatusBadge status={v.status} />
                      </span>
                      <VendorRowActions
                        status={v.status}
                        apiPath={`/api/admin/vehicles/${v.id}`}
                        editHref={`/chim/vendors/vehicles/${v.id}/edit`}
                        profileHref={`/vehicles/${v.id}`}
                      />
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
