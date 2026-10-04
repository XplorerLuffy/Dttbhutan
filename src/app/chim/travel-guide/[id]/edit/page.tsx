import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import ArticleForm from "@/components/admin/ArticleForm";

export default async function EditArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { id } = await params;
  const article = await prisma.article.findUnique({ where: { id } });
  if (!article) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit article</h1>
      <ArticleForm
        initial={{
          id: article.id,
          title: article.title,
          slug: article.slug,
          category: article.category,
          excerpt: article.excerpt,
          content: article.content,
          coverPhotoUrl: article.coverPhotoUrl ?? "",
          photoUrls: article.photoUrls,
          readMinutes: article.readMinutes,
          status: article.status,
        }}
      />
    </div>
  );
}
