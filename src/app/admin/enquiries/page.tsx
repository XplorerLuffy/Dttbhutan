import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import EnquiryStatusControls from "@/components/admin/EnquiryStatusControls";

const STATUS_BADGE: Record<string, string> = {
  NEW: "badge-pending",
  IN_PROGRESS: "badge",
  CLOSED: "badge-approved",
};

export const dynamic = "force-dynamic";

export default async function AdminEnquiriesPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const messages = await prisma.contactMessage.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    include: { traveler: { select: { email: true, role: true } } },
  });

  const newCount = messages.filter((m) => m.status === "NEW").length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Enquiries</h1>
        <p className="text-sm text-stone-500">
          Messages from the public contact form.{" "}
          {newCount > 0 ? `${newCount} unread.` : "All caught up."}
        </p>
      </div>

      <div className="space-y-3">
        {messages.map((m) => (
          <div key={m.id} className="card">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium">
                  {m.subject || "(no subject)"}{" "}
                  <span className={STATUS_BADGE[m.status] ?? "badge"}>
                    {m.status.replace("_", " ")}
                  </span>
                </p>
                <p className="text-sm text-stone-500">
                  {m.name} ·{" "}
                  <a href={`mailto:${m.email}`} className="text-brand-700 hover:underline">
                    {m.email}
                  </a>
                  {m.phone ? ` · ${m.phone}` : ""} ·{" "}
                  {m.createdAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <p className="mt-1 text-xs text-stone-400">
                  {m.traveler
                    ? `Signed in as ${m.traveler.email} (${m.traveler.role})`
                    : "Not signed in — no account"}
                </p>
              </div>
              <EnquiryStatusControls id={m.id} status={m.status} />
            </div>

            <p className="mt-3 whitespace-pre-wrap border-t border-stone-100 pt-3 text-sm text-stone-700">
              {m.message}
            </p>
          </div>
        ))}

        {messages.length === 0 && (
          <p className="text-sm text-stone-500">No enquiries yet.</p>
        )}
      </div>
    </div>
  );
}
