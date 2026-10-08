import Link from "next/link";
import Image from "next/image";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
  ARTICLE: { label: "Travel guide", href: "/chim/travel-guide" },
  PACKAGE: { label: "Package tours", href: "/chim/packages" },
  DESTINATION: { label: "Destinations", href: "/chim/destinations" },
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
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

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
    <div className="space-y-6">
      <section className="relative isolate overflow-hidden rounded-2xl border border-stone-200 bg-[#fcf6e9]">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          sizes="(min-width: 1024px) 70vw, 100vw"
          className="-z-10 object-cover object-right opacity-60"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#fcf6e9] via-[#fcf6e9]/90 to-transparent" />
        <div className="flex flex-wrap items-end justify-between gap-4 px-5 py-7 sm:px-8 sm:py-9">
          <div className="max-w-3xl">
            <h1
              data-hero
              className="font-display text-3xl font-semibold text-stone-900 sm:text-4xl"
            >
              DRUKA&rsquo;s knowledge
            </h1>
            <p className="mt-1.5 text-sm text-stone-700 sm:text-base">
              Everything the travel assistant can quote. Prices, dates and
              availability are read live from the database and never come from
              here — this is the written material behind the answers: policies,
              FAQ replies, and the descriptive text from your packages,
              destinations and articles.
            </p>
          </div>
          <Link href="/chim/knowledge/new" className="btn-primary">
            + Teach DRUKA something
          </Link>
        </div>
      </section>

      {!agencyId && (
        <p className="card text-sm text-red-700">
          No agency is configured for this deployment, so there is no knowledge
          base to show. Set <code>AGENCY_SLUG</code> and run{" "}
          <code>npm run ai:ingest</code>.
        </p>
      )}

      <section
        className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4"
        aria-label="Summary"
      >
        {[
          { label: "Documents", value: documents.length },
          { label: "Passages", value: totalChunks },
          { label: "Written by you", value: authored.length },
          { label: "Read from website", value: generated.length },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5"
          >
            <p className="text-sm font-medium text-stone-600">{c.label}</p>
            <p className="mt-1 font-display text-2xl font-bold text-stone-900 sm:text-3xl">
              {c.value}
            </p>
          </div>
        ))}
      </section>

      <section
        className={`rounded-2xl border p-4 shadow-sm sm:p-5 ${
          unembedded > 0
            ? "border-amber-200 bg-amber-50"
            : "border-stone-200 bg-white"
        }`}
      >
        <p
          className={`text-sm ${unembedded > 0 ? "text-amber-800" : "text-stone-600"}`}
        >
          {unembedded === 0
            ? "All indexed for meaning-based search."
            : `${unembedded} ${unembedded === 1 ? "passage is" : "passages are"} keyword-only — re-save or refresh to index.`}
        </p>
        <div className="mt-4 border-t border-stone-200/70 pt-4">
          <KnowledgeSyncButton />
          <p className="mt-2 text-xs text-stone-500">
            Run this after editing a package, destination or article so DRUKA
            can talk about the new wording.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-3 font-display text-lg font-semibold">
          Written by you
        </h2>
        <div className="space-y-3">
          {authored.map((d) => (
            <Link
              key={d.id}
              href={`/chim/knowledge/${d.id}/edit`}
              className="card block transition-colors hover:border-brass-300"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium">
                    {d.title}{" "}
                    <span
                      className={
                        d.status === "PUBLISHED"
                          ? "badge-approved"
                          : "badge-pending"
                      }
                    >
                      {d.status === "PUBLISHED" ? "Published" : "Draft"}
                    </span>
                    {d.visibility === "INTERNAL" && (
                      <span className="badge-pending ml-1">Staff only</span>
                    )}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-500">
                    {d.content.slice(0, 220)}
                  </p>
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
              Nothing written by hand yet. Start with the questions travellers
              ask that no package page answers.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5">
        <h2 className="mb-1 font-display text-lg font-semibold">
          Read from your website
        </h2>
        <p className="mb-3 text-sm text-stone-500">
          Regenerated every time you refresh, so edit these where they live.
        </p>
        <div className="space-y-2">
          {generated.map((d) => {
            const origin = GENERATED_ORIGIN[d.sourceType];
            return (
              <div
                key={d.id}
                className="card flex flex-wrap items-center justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{d.title}</p>
                  <p className="text-xs text-stone-400">
                    {KIND_LABEL[d.sourceType] ?? d.sourceType} ·{" "}
                    {d._count.chunks}{" "}
                    {d._count.chunks === 1 ? "passage" : "passages"}
                  </p>
                </div>
                {origin && (
                  <Link
                    href={origin.href}
                    className="shrink-0 text-xs font-medium text-brass-600 hover:underline"
                  >
                    Edit in {origin.label} →
                  </Link>
                )}
              </div>
            );
          })}
          {generated.length === 0 && (
            <p className="text-sm text-stone-500">
              Nothing indexed from the website yet — use &ldquo;Refresh from
              website content&rdquo; above.
            </p>
          )}
        </div>
      </section>
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
