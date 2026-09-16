import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New travel guide article</h1>
      <ArticleForm />
    </div>
  );
}
