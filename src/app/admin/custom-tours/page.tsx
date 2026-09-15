import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import CustomTourRequestControls from "@/components/admin/CustomTourRequestControls";
import StatusBadge from "@/components/StatusBadge";

export default async function AdminCustomToursPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const requests = await prisma.customTourRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: { traveler: true, destinations: true },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Custom tour requests</h1>
      <p className="mb-6 text-sm text-stone-600">
        Inquiries with no fixed itinerary yet — follow up with the traveler
        directly (email/phone below) to put together a quote.
      </p>

      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="card">
            <div className="flex items-start justify-between gap-4">
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
        {requests.length === 0 && <p className="text-sm text-stone-500">No custom tour requests yet.</p>}
      </div>
    </div>
  );
}
