/**
 * Does retrieval actually find the right answer? Run with:
 *   GEMINI_API_KEY=… EMBEDDING_PROVIDER=gemini npm run check:ai:semantic
 *
 * This is a CHECK, not a test, and deliberately not part of `npm run
 * test:ai`: it costs API calls, needs a key, and needs the knowledge base
 * ingested first (`npm run ai:ingest`). The suite in retrieval.test.ts
 * proves the ordering logic with hand-written fixture vectors; that can
 * never prove a real model puts a question near its answer, which is the
 * one thing that decides whether the assistant is grounded or guessing.
 *
 * Each question below is phrased the way a traveller would ask it, sharing
 * as few words as possible with the document that should answer it —
 * "do I have to hire a guide" against a document titled "Do I need to travel
 * with a guide in Bhutan?". Keyword search would struggle; embeddings
 * shouldn't. That gap is the point.
 *
 * Failure here means the embeddings are not doing their job: usually the
 * chunks were stored without vectors (so retrieval silently fell back to
 * text search), or documents were ingested with one model and queried with
 * another. It does not mean the retrieval code is broken.
 */
import { PrismaClient } from "@prisma/client";
import { retrieveKnowledge } from "@/lib/ai/retrieval";

const prisma = new PrismaClient();

/** A question, and a substring that must appear in the top hit's title. */
const EXPECTATIONS: Array<{ question: string; expect: string }> = [
  { question: "what happens if I have to pull out of the trip?", expect: "Cancellation" },
  { question: "do I have to hire somebody to show me around?", expect: "guide" },
  { question: "what's the daily levy visitors have to pay?", expect: "Sustainable Development Fee" },
  { question: "which month has the clearest weather for the mountains?", expect: "Best Time" },
  { question: "can I settle the bill with a card?", expect: "Payments" },
  { question: "what paperwork do I need to get into the country?", expect: "Visa" },
];

async function main() {
  const agency = await prisma.agency.findFirst({ where: { slug: process.env.AGENCY_SLUG?.trim() || "droelma" } });
  if (!agency) throw new Error("No agency found — run `npm run db:seed` first.");

  const chunks = await prisma.$queryRaw<Array<{ total: bigint; embedded: bigint }>>`
    SELECT COUNT(*) AS total, COUNT(embedding) AS embedded FROM "KnowledgeChunk"
  `;
  // COUNT(*) arrives as a bigint; Number() is safe at these magnitudes and
  // keeps this file off BigInt literals, which the project's target predates.
  const total = Number(chunks[0].total);
  const embedded = Number(chunks[0].embedded);
  console.log(`Knowledge base: ${total} chunks, ${embedded} with embeddings\n`);
  if (total === 0) throw new Error("No chunks — run `npm run ai:ingest` first.");
  if (embedded === 0) {
    console.warn("⚠️  No chunk has an embedding, so every hit below comes from the");
    console.warn("   text-search fallback. This check cannot tell you anything about");
    console.warn("   embedding quality until ingestion runs with a reachable provider.\n");
  }

  let passed = 0;
  let failed = 0;

  for (const { question, expect } of EXPECTATIONS) {
    // PUBLIC only: these are the questions an anonymous traveller asks, and
    // an internal note outranking a public page would be a leak, not a hit.
    const result = await retrieveKnowledge({
      query: question,
      agencyId: agency.id,
      visibility: ["PUBLIC"],
      limit: 3,
    });
    const top = result.chunks[0];
    const ok = top ? top.title.toLowerCase().includes(expect.toLowerCase()) : false;
    // Worth printing: a "text-fallback" here means the embedding provider was
    // unreachable, so a pass proves keyword luck rather than semantics.
    const mode = result.mode === "vector" ? "" : `  [${result.mode}]`;
    if (ok) {
      passed++;
      console.log(`PASS  "${question}"${mode}`);
      console.log(`        → ${top.title}${top.distance === null ? "" : ` (distance ${top.distance.toFixed(3)})`}`);
    } else {
      failed++;
      console.log(`FAIL  "${question}"${mode}`);
      console.log(`        expected a title containing "${expect}"`);
      console.log(
        result.chunks.length
          ? `        got: ${result.chunks.map((h) => h.title).join(" | ")}`
          : "        got: nothing retrieved"
      );
    }
    if (result.degradedReason) console.log(`        degraded: ${result.degradedReason}`);
  }

  console.log(`\n${passed}/${passed + failed} questions found their answer`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
