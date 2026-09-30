import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import { getCurrentAgencyId } from "@/lib/ai/retrieval";
import KnowledgeForm from "@/components/admin/KnowledgeForm";

/** Same set the API route enforces — a generated document has no editable form,
 * so this page refuses it rather than showing one that would be rejected. */
const HAND_AUTHORED = new Set(["MANUAL", "FAQ", "POLICY", "UPLOAD"]);

export default async function EditKnowledgePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { id } = await params;
  const agencyId = await getCurrentAgencyId();

  const document = await prisma.knowledgeDocument.findUnique({
    where: { id },
    select: {
      id: true,
      agencyId: true,
      title: true,
      content: true,
      sourceType: true,
      category: true,
      visibility: true,
      status: true,
      _count: { select: { chunks: true } },
    },
  });

  if (!document || document.agencyId !== agencyId) notFound();
  if (!HAND_AUTHORED.has(document.sourceType)) redirect("/admin/knowledge");

  return (
    <div>
      <Link href="/admin/knowledge" className="text-sm text-stone-500 hover:underline">
        ← DRUKA&rsquo;s knowledge
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Edit knowledge</h1>
      <p className="mb-6 text-sm text-stone-600">
        Saving re-reads the whole text and re-indexes it, which takes a few seconds.
      </p>
      <KnowledgeForm
        initial={{
          id: document.id,
          title: document.title,
          content: document.content,
          sourceType: document.sourceType as "MANUAL" | "FAQ" | "POLICY" | "UPLOAD",
          category: document.category ?? "",
          visibility: document.visibility,
          status: document.status,
          chunkCount: document._count.chunks,
        }}
      />
    </div>
  );
}
