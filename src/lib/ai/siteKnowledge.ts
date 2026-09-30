import "server-only";
import { prisma } from "@/lib/prisma";
import { ingestDocument, type IngestResult } from "@/lib/ai/ingestion";

/**
 * Turns what's already on the website into things the assistant can quote.
 *
 * The grounding tools (search_packages, get_package, …) already answer precise
 * lookups — "what does X cost", "how many days is Y" — by querying Postgres
 * directly. What they cannot do is answer the vaguer question a traveller
 * actually arrives with: "somewhere quiet with a short walk and a festival".
 * That needs the *prose* — the day descriptions, a destination's highlights —
 * to be retrievable, which means it has to live in the knowledge base as text.
 *
 * So this indexes rather than duplicates. The Itinerary and Destination rows
 * stay the source of truth the website renders from; these are searchable
 * copies, replaced (not appended) on every run via sourceRef, so re-running
 * after an edit leaves one current copy rather than two that disagree.
 *
 * Only PUBLISHED packages and articles are indexed. A draft package the admin
 * is still writing must not start coming out of the assistant's mouth.
 */

/**
 * Which slice of the site to refresh.
 *
 * A full refresh re-embeds every package, destination and article, which is
 * well over a minute of embedding calls — longer than a serverless function is
 * allowed to run. So the admin screen refreshes one kind at a time and each
 * request stays inside its budget; "all" remains for the CLI ingest script,
 * which has no such limit.
 */
export type SyncScope = "all" | "packages" | "destinations" | "articles";

export type SyncSummary = {
  packages: number;
  destinations: number;
  articles: number;
  documents: number;
  chunks: number;
  embedded: number;
  /** Set when the embedding provider was unreachable. Chunks are still stored
   * and still findable through retrieval's text-search fallback; re-running
   * once a provider is up fills the vectors in. */
  embeddingSkippedReason?: string;
};

/** Prefixed so a package slug and an article slug can never collide in the
 * replace-by-sourceRef lookup, even though they're separate sourceTypes
 * today — the prefix keeps that true if the types are ever merged. */
function ref(kind: string, slug: string): string {
  return `${kind}:${slug}`;
}

function joinLines(parts: (string | null | undefined | false)[]): string {
  return parts.filter((p): p is string => Boolean(p && String(p).trim())).join("\n");
}

/**
 * One package as prose. Written to read like a description rather than a
 * record dump, because a chunk of it is what the model will be handed as
 * context — "Day 3: Punakha. Walk to Chimi Lhakhang…" retrieves and reads far
 * better than a row of fields.
 */
function packageToText(pkg: {
  title: string;
  summary: string;
  description: string | null;
  durationDays: number;
  pricePerPerson: unknown;
  difficulty: string;
  category: string;
  maxGroupSize: number | null;
  includes: string[];
  excludes: string[];
  days: {
    dayNumber: number;
    title: string;
    description: string | null;
    activities: string[];
    mealsIncluded: string[];
    destination: { name: string } | null;
  }[];
  lodgings: { name: string; location: string | null; description: string | null }[];
}): string {
  const nights = pkg.durationDays - 1;

  const head = joinLines([
    pkg.summary,
    pkg.description,
    `This is a ${pkg.category.toLowerCase()} trip lasting ${pkg.durationDays} days${
      nights > 0 ? ` and ${nights} nights` : ""
    }, at ${pkg.difficulty.toLowerCase()} activity level, priced from ${String(
      pkg.pricePerPerson
    )} BTN per person.`,
    pkg.maxGroupSize ? `Group size is up to ${pkg.maxGroupSize} travellers.` : null,
    pkg.includes.length > 0 ? `The price includes: ${pkg.includes.join(", ")}.` : null,
    pkg.excludes.length > 0 ? `Not included: ${pkg.excludes.join(", ")}.` : null,
  ]);

  const days = pkg.days
    .map((day) =>
      joinLines([
        `Day ${day.dayNumber}: ${day.title}${day.destination ? ` (${day.destination.name})` : ""}`,
        day.description,
        day.activities.length > 0 ? `Activities: ${day.activities.join(", ")}.` : null,
        day.mealsIncluded.length > 0 ? `Meals included: ${day.mealsIncluded.join(", ")}.` : null,
      ])
    )
    .join("\n\n");

  const stays = pkg.lodgings
    .map((l) =>
      joinLines([
        `${l.name}${l.location ? ` — ${l.location}` : ""}`,
        l.description,
      ])
    )
    .join("\n\n");

  return joinLines([
    head,
    days && `\nDay by day:\n\n${days}`,
    stays && `\nWhere you stay:\n\n${stays}`,
  ]);
}

function destinationToText(d: {
  name: string;
  region: string;
  description: string | null;
  highlights: string[];
}): string {
  return joinLines([
    `${d.name} is a dzongkhag (district) in ${d.region.toLowerCase()}ern Bhutan.`,
    d.description,
    d.highlights.length > 0 ? `Notable sights: ${d.highlights.join(", ")}.` : null,
  ]);
}

export async function syncSiteKnowledge(
  agencyId: string,
  scope: SyncScope = "all"
): Promise<SyncSummary> {
  const wants = (kind: Exclude<SyncScope, "all">) => scope === "all" || scope === kind;

  const summary: SyncSummary = {
    packages: 0,
    destinations: 0,
    articles: 0,
    documents: 0,
    chunks: 0,
    embedded: 0,
  };

  const record = (result: IngestResult) => {
    summary.documents += 1;
    summary.chunks += result.chunkCount;
    summary.embedded += result.embeddedCount;
    if (result.embeddingSkippedReason && !summary.embeddingSkippedReason) {
      summary.embeddingSkippedReason = result.embeddingSkippedReason;
    }
  };

  const packages = !wants("packages") ? [] : await prisma.itinerary.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      summary: true,
      description: true,
      durationDays: true,
      pricePerPerson: true,
      difficulty: true,
      category: true,
      maxGroupSize: true,
      includes: true,
      excludes: true,
      days: {
        orderBy: { dayNumber: "asc" },
        select: {
          dayNumber: true,
          title: true,
          description: true,
          activities: true,
          mealsIncluded: true,
          destination: { select: { name: true } },
        },
      },
      lodgings: { select: { name: true, location: true, description: true } },
    },
  });

  for (const pkg of packages) {
    record(
      await ingestDocument({
        agencyId,
        title: pkg.title,
        content: packageToText(pkg),
        sourceType: "PACKAGE",
        sourceRef: ref("package", pkg.slug),
        category: "Packages",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      })
    );
    summary.packages += 1;
  }

  // Destinations with nothing written about them would index as a bare name
  // and a region — noise that can only dilute retrieval, never improve it.
  const destinations = !wants("destinations") ? [] : await prisma.destination.findMany({
    select: { slug: true, name: true, region: true, description: true, highlights: true },
  });

  for (const d of destinations) {
    if (!d.description?.trim() && d.highlights.length === 0) continue;
    record(
      await ingestDocument({
        agencyId,
        title: d.name,
        content: destinationToText(d),
        sourceType: "DESTINATION",
        sourceRef: ref("destination", d.slug),
        category: "Destinations",
        visibility: "PUBLIC",
        status: "PUBLISHED",
      })
    );
    summary.destinations += 1;
  }

  const articles = !wants("articles") ? [] : await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, title: true, category: true, excerpt: true, content: true },
  });

  for (const article of articles) {
    record(
      await ingestDocument({
        agencyId,
        title: article.title,
        // Excerpt first: it's the article's own summary, so the opening chunk
        // stands on its own better than a bare first paragraph would.
        content: `${article.excerpt}\n\n${article.content}`,
        sourceType: "ARTICLE",
        sourceRef: article.slug,
        category: article.category,
        visibility: "PUBLIC",
        status: "PUBLISHED",
      })
    );
    summary.articles += 1;
  }

  return summary;
}
