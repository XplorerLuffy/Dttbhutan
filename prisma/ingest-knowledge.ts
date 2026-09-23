import { PrismaClient } from "@prisma/client";
import { ingestDocument } from "@/lib/ai/ingestion";
import { KNOWLEDGE_SEED } from "./data/knowledgeSeed";

/**
 * Builds the knowledge base for one agency. Run with: npm run ai:ingest
 *
 * Two sources, deliberately:
 *   1. Published Articles — content that already lives in Postgres. These
 *      are INDEXED here, not copied: the Article stays the source of truth
 *      for the website's travel-guide pages, and re-running this refreshes
 *      the searchable copy rather than forking it.
 *   2. prisma/data/knowledgeSeed.ts — text that has no database home today
 *      (FAQ answers and policies currently hardcoded as JSX).
 *
 * Idempotent: every document carries a sourceRef and ingestion replaces any
 * previous document with the same one, so running this repeatedly leaves
 * one current copy of each rather than accumulating duplicates.
 *
 * Embeddings are best-effort. With no reachable embedding provider the
 * chunks are still stored and still findable via retrieval's text-search
 * fallback — re-run this once Ollama is up to fill the vectors in.
 */

const prisma = new PrismaClient();

/** Hosts considered a local development database. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * This script takes no connection argument — it writes wherever DATABASE_URL
 * happens to point, which on a machine configured for deploys is production.
 * Ingestion deletes and recreates documents (replace-by-sourceRef), so an
 * unnoticed production DATABASE_URL is destructive, not just noisy.
 *
 * Run against a non-local database with:
 *   npm run ai:ingest -- --allow-production
 */
function assertSafeTarget(): void {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — nothing to ingest into.");

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    // Refusing on an unparseable URL is the safe direction: better to stop
    // than to guess at a host and possibly guess "local" for a remote one.
    throw new Error("DATABASE_URL could not be parsed as a connection string; refusing to ingest.");
  }

  if (LOCAL_HOSTS.has(host)) return;

  if (process.argv.includes("--allow-production")) {
    console.warn(`⚠️  --allow-production: ingesting into NON-LOCAL database at ${host}\n`);
    return;
  }

  throw new Error(
    `Refusing to ingest: DATABASE_URL points at "${host}", which is not a local database.\n` +
      `Ingestion replaces knowledge documents and their chunks at the target.\n` +
      `If that is genuinely intended, re-run with: npm run ai:ingest -- --allow-production`
  );
}

async function main() {
  assertSafeTarget();

  const slug = process.env.AGENCY_SLUG?.trim() || "droelma";

  const agency = await prisma.agency.upsert({
    where: { slug },
    update: {},
    create: { slug, name: process.env.AGENCY_NAME?.trim() || "Droelma Tours & Travels" },
  });
  console.log(`Agency: ${agency.name} (${agency.slug})`);

  let totalChunks = 0;
  let totalEmbedded = 0;
  const skipReasons = new Set<string>();

  for (const entry of KNOWLEDGE_SEED) {
    const result = await ingestDocument({
      agencyId: agency.id,
      title: entry.title,
      content: entry.content,
      sourceType: entry.sourceType,
      sourceRef: entry.sourceRef,
      category: entry.category,
      visibility: entry.visibility,
      status: "PUBLISHED",
    });
    totalChunks += result.chunkCount;
    totalEmbedded += result.embeddedCount;
    if (result.embeddingSkippedReason) skipReasons.add(result.embeddingSkippedReason);
    console.log(
      `  [${entry.visibility}] ${entry.title} — ${result.chunkCount} chunks, ${result.embeddedCount} embedded`
    );
  }

  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, title: true, category: true, excerpt: true, content: true },
  });

  for (const article of articles) {
    const result = await ingestDocument({
      agencyId: agency.id,
      title: article.title,
      // Excerpt first: it's the article's own summary, which makes the
      // opening chunk a better standalone answer than a bare first
      // paragraph would be.
      content: `${article.excerpt}\n\n${article.content}`,
      sourceType: "ARTICLE",
      sourceRef: article.slug,
      category: article.category,
      visibility: "PUBLIC",
      status: "PUBLISHED",
    });
    totalChunks += result.chunkCount;
    totalEmbedded += result.embeddedCount;
    if (result.embeddingSkippedReason) skipReasons.add(result.embeddingSkippedReason);
    console.log(`  [PUBLIC] (article) ${article.title} — ${result.chunkCount} chunks, ${result.embeddedCount} embedded`);
  }

  console.log(`\n${totalChunks} chunks stored, ${totalEmbedded} embedded.`);
  if (skipReasons.size > 0) {
    console.log(
      `\n⚠️  Embeddings were skipped — chunks are stored and searchable via the text fallback only.\n` +
        `   Reason: ${[...skipReasons][0]}\n` +
        `   Start Ollama (and \`ollama pull nomic-embed-text\`), then re-run this to fill in vectors.`
    );
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
