import { getCurrentUser } from "@/lib/auth";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">New travel guide article</h1>
      <ArticleForm />
    </div>
  );
}
