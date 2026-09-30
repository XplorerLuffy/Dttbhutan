import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import KnowledgeForm from "@/components/admin/KnowledgeForm";

export default async function NewKnowledgePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  return (
    <div>
      <Link href="/admin/knowledge" className="text-sm text-stone-500 hover:underline">
        ← DRUKA&rsquo;s knowledge
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Teach DRUKA something</h1>
      <p className="mb-6 max-w-2xl text-sm text-stone-600">
        Write it as an answer, not as notes. DRUKA hands a traveller a passage or two of this text and answers
        in its own words — so the clearer and more complete each paragraph is, the better the reply.
      </p>
      <KnowledgeForm />
    </div>
  );
}
