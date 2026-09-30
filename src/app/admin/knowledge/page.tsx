import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import { getCurrentAgencyId } from "@/lib/ai/retrieval";
import KnowledgeSyncButton from "@/components/admin/KnowledgeSyncButton";

/** Mirrors EDITABLE_SOURCE_TYPES in the API route: these are hand-authored, the
 * rest are regenerated from the website's own rows. */
const HAND_AUTHORED = new Set(["MANUAL", "FAQ", "POLICY", "UPLOAD"]);

const KIND_LABEL: Record<string, string> = {
  MANUAL: "General",
  FAQ: "FAQ",
  POLICY: "Policy",
  UPLOAD: "Document",
  ARTICLE: "Article",
  PACKAGE: "Package tour",
  DESTINATION: "Destination",
};

/** Where a generated document came from, so "not editable here" comes with
 * somewhere to go instead of a dead end. */
const GENERATED_ORIGIN: Record<string, { label: string; href: string }> = {
  ARTICLE: { label: "Travel guide", href: "/admin/travel-guide" },
  PACKAGE: { label: "Package tours", href: "/admin/packages" },
  DESTINATION: { label: "Destinations", href: "/admin/destinations" },
};

/**
 * What DRUKA knows.
 *
 * Two kinds of row, shown together on purpose. The hand-authored ones are
 * editable here and are the only place some facts live at all (cancellation
 * terms, visa rules). The generated ones are searchable copies of packages,
 * destinations and articles — listed because an admin wondering "why did DRUKA
 * not mention the Punakha trip" needs to see whether it has been indexed, but
 * edited at their source rather than here.
 */
export default async function AdminKnowledgePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const agencyId = await getCurrentAgencyId();

  const documents = agencyId
    ? await prisma.knowledgeDocument.findMany({
        where: { agencyId },
        orderBy: [{ sourceType: "asc" }, { updatedAt: "desc" }],
        select: {
          id: true,
          title: true,
          sourceType: true,
          category: true,
          visibility: true,
          status: true,
          updatedAt: true,
          content: true,
          _count: { select: { chunks: true } },
        },
      })
    : [];

  // A chunk with no vector is only findable by keyword. Counting them here is
  // the one place an admin can tell that the knowledge base is half-indexed.
  // Raw SQL because `embedding` is an Unsupported("vector") column, which
  // Prisma's typed client cannot put in a `where` — the same reason ingestion
  // and retrieval reach for $queryRaw.
  const unembedded = agencyId ? await countUnembeddedChunks(agencyId) : 0;

  const authored = documents.filter((d) => HAND_AUTHORED.has(d.sourceType));
  const generated = documents.filter((d) => !HAND_AUTHORED.has(d.sourceType));
  const totalChunks = documents.reduce((sum, d) => sum + d._count.chunks, 0);

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">DRUKA&rsquo;s knowledge</h1>
        <Link href="/admin/knowledge/new" className="btn-primary">
          + Teach DRUKA something
        </Link>
      </div>

      <p className="mb-6 max-w-3xl text-sm text-stone-600">
        Everything the travel assistant can quote. Prices, dates and availability are read live from the
        database and never come from here — this is the written material behind the answers: policies, FAQ
        replies, and the descriptive text from your packages, destinations and articles.
      </p>

      {!agencyId && (
        <p className="card mb-6 text-sm text-red-700">
          No agency is configured for this deployment, so there is no knowledge base to show. Set{" "}
          <code>AGENCY_SLUG</code> and run <code>npm run ai:ingest</code>.
        </p>
      )}

      <div className="card mb-6">
        <div className="flex flex-wrap items-baseline gap-x-6 gap-y-1 text-sm">
          <p>
            <span className="font-display text-xl font-bold">{documents.length}</span> documents
          </p>
          <p>
            <span className="font-display text-xl font-bold">{totalChunks}</span> passages
          </p>
          <p className={unembedded > 0 ? "text-amber-700" : "text-stone-500"}>
            {unembedded === 0
              ? "All indexed for meaning-based search."
              : `${unembedded} ${unembedded === 1 ? "passage is" : "passages are"} keyword-only — re-save or refresh to index.`}
          </p>
        </div>
        <div className="mt-4 border-t border-stone-200 pt-4">
          <KnowledgeSyncButton />
          <p className="mt-2 text-xs text-stone-500">
            Run this after editing a package, destination or article so DRUKA can talk about the new wording.
          </p>
        </div>
      </div>

      <h2 className="mb-3 text-lg font-semibold">Written by you</h2>
      <div className="mb-8 space-y-3">
        {authored.map((d) => (
          <Link
            key={d.id}
            href={`/admin/knowledge/${d.id}/edit`}
            className="card block transition-colors hover:border-brass-300"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-medium">
                  {d.title}{" "}
                  <span className={d.status === "PUBLISHED" ? "badge-approved" : "badge-pending"}>
                    {d.status === "PUBLISHED" ? "Published" : "Draft"}
                  </span>
                  {d.visibility === "INTERNAL" && <span className="badge-pending ml-1">Staff only</span>}
                </p>
                <p className="mt-1 line-clamp-2 text-sm text-stone-500">{d.content.slice(0, 220)}</p>
              </div>
              <p className="shrink-0 text-xs text-stone-400">
                {KIND_LABEL[d.sourceType] ?? d.sourceType}
                {d.category ? ` · ${d.category}` : ""} · {d._count.chunks}{" "}
                {d._count.chunks === 1 ? "passage" : "passages"}
              </p>
            </div>
          </Link>
        ))}
        {authored.length === 0 && (
          <p className="text-sm text-stone-500">
            Nothing written by hand yet. Start with the questions travellers ask that no package page answers.
          </p>
        )}
      </div>

      <h2 className="mb-1 text-lg font-semibold">Read from your website</h2>
      <p className="mb-3 text-sm text-stone-500">
        Regenerated every time you refresh, so edit these where they live.
      </p>
      <div className="space-y-2">
        {generated.map((d) => {
          const origin = GENERATED_ORIGIN[d.sourceType];
          return (
            <div key={d.id} className="card flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{d.title}</p>
                <p className="text-xs text-stone-400">
                  {KIND_LABEL[d.sourceType] ?? d.sourceType} · {d._count.chunks}{" "}
                  {d._count.chunks === 1 ? "passage" : "passages"}
                </p>
              </div>
              {origin && (
                <Link href={origin.href} className="shrink-0 text-xs font-medium text-brass-600 hover:underline">
                  Edit in {origin.label} →
                </Link>
              )}
            </div>
          );
        })}
        {generated.length === 0 && (
          <p className="text-sm text-stone-500">
            Nothing indexed from the website yet — use &ldquo;Refresh from website content&rdquo; above.
          </p>
        )}
      </div>
    </div>
  );
}

async function countUnembeddedChunks(agencyId: string): Promise<number> {
  const rows = await prisma.$queryRaw<{ count: bigint }[]>`
    SELECT COUNT(*)::bigint AS "count"
    FROM "KnowledgeChunk"
    WHERE "agencyId" = ${agencyId} AND "embedding" IS NULL
  `;
  return Number(rows[0]?.count ?? 0);
}
