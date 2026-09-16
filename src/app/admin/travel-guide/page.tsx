import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";

export default async function AdminTravelGuidePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const articles = await prisma.article.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Travel guide articles</h1>
        <Link href="/admin/travel-guide/new" className="btn-primary">
          + New article
        </Link>
      </div>

      <div className="space-y-3">
        {articles.map((a) => (
          <div key={a.id} className="card flex items-center justify-between">
            <div>
              <p className="font-medium">
                {a.title}{" "}
                <span className={a.status === "PUBLISHED" ? "badge-approved" : "badge-pending"}>{a.status}</span>
              </p>
              <p className="text-sm text-stone-500">
                {a.category} · {a.readMinutes} min read
              </p>
            </div>
            <Link href={`/admin/travel-guide/${a.id}/edit`} className="btn-secondary">
              Edit
            </Link>
          </div>
        ))}
        {articles.length === 0 && <p className="text-sm text-stone-500">No articles yet.</p>}
      </div>
    </div>
  );
}
