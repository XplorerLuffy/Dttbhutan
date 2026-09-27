import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import { getSiteContent } from "@/lib/content";
import { CONTENT_GROUPS } from "@/lib/content/registry";
import ContentEditor from "@/components/admin/ContentEditor";

export const metadata = { title: "Site content" };

export default async function AdminContentPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const content = await getSiteContent();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Site content</h1>
      <p className="mb-6 max-w-2xl text-sm text-stone-600">
        Wording shown across the public site. Changes appear immediately — there is no separate
        publish step. Figures counted from real data, like the number of tour packages or the
        average review score, aren&apos;t editable here on purpose.
      </p>

      <ContentEditor groups={CONTENT_GROUPS} initial={content.all} />
    </div>
  );
}
