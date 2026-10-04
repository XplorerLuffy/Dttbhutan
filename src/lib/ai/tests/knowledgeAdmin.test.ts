/**
 * Admin knowledge editing, end to end against a real database.
 * Run with: npm run test:ai:knowledge
 *
 * NOT part of `npm run test:ai` — every other test in this directory is pure
 * and runs anywhere, while this one needs a Postgres with pgvector and the
 * seeded agency. Keeping it separate means the default suite stays runnable
 * without a database.
 *
 * What it covers is the part of /chim/knowledge that can go wrong quietly:
 *   - a document created from the dashboard is chunked, embedded, and actually
 *     retrievable afterwards — the whole point of the screen
 *   - an edit REPLACES its chunks rather than adding to them, and keeps the
 *     document id, so the edit URL survives a save and the assistant is left
 *     with one version of the text rather than two that disagree
 *   - a PUBLIC → INTERNAL change stops an anonymous visitor retrieving it.
 *     KnowledgeChunk carries its own copy of `visibility`, so this only holds
 *     because the chunks are rebuilt — the failure mode is silent and would
 *     leak staff-only text to the public chat widget
 *   - a DRAFT document is never retrieved, by anyone
 *   - deleting takes the chunks with it, leaving nothing findable behind
 *
 * It creates one document, mutates it, and deletes it, leaving the database
 * as it found it.
 */
/**
 * The embedding provider is not reachable from this container (Ollama Cloud has
 * no embeddings endpoint, and the Gemini key was rotated after being pasted in
 * chat). Stubbing the HTTP call rather than the provider keeps the whole real
 * path under test — provider selection, the 768-float contract, setChunkEmbedding's
 * raw-SQL vector write — with only the network faked. Deterministic vectors so
 * cosine distance is stable: each text hashes to its own direction.
 */
process.env.EMBEDDING_PROVIDER = "gemini";
process.env.GEMINI_API_KEY = "stub-key-for-this-test";
const realFetch = globalThis.fetch;
globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
  const target = String(url);
  if (!target.includes("generativelanguage.googleapis.com")) return realFetch(url as never, init);
  const text = String(JSON.parse(String(init?.body ?? "{}")).content?.parts?.[0]?.text ?? "");
  // Hashed bag of words, L2-normalized: shared vocabulary means a small cosine
  // distance, so "yak butter festival" really does land near the document that
  // talks about one. A per-text hash would give every vector its own arbitrary
  // direction and make the distance threshold meaningless.
  const values = new Array(768).fill(0);
  for (const word of text.toLowerCase().match(/[a-z0-9]+/g) ?? []) {
    let h = 17;
    for (const ch of word) h = (h * 31 + ch.charCodeAt(0)) % 768;
    values[h] += 1;
  }
  const norm = Math.sqrt(values.reduce((a, v) => a + v * v, 0)) || 1;
  for (let i = 0; i < values.length; i++) values[i] /= norm;
  return new Response(JSON.stringify({ embedding: { values } }), { status: 200 });
}) as typeof fetch;

import { prisma } from "@/lib/prisma";
import { ingestDocument, reingestDocument } from "@/lib/ai/ingestion";
import { getCurrentAgencyId } from "@/lib/ai/retrieval";
import { retrieveKnowledge } from "@/lib/ai/retrieval";

let pass = 0, fail = 0;
function check(name: string, ok: boolean, detail?: string) {
  if (ok) { pass++; console.log(`PASS  ${name}`); }
  else { fail++; console.error(`FAIL  ${name}${detail ? `\n      ${detail}` : ""}`); }
}

async function chunksOf(documentId: string) {
  return prisma.$queryRaw<{ id: string; visibility: string; chunkIndex: number; hasVector: boolean }[]>`
    SELECT "id", "visibility"::text AS "visibility", "chunkIndex", ("embedding" IS NOT NULL) AS "hasVector"
    FROM "KnowledgeChunk" WHERE "documentId" = ${documentId} ORDER BY "chunkIndex"
  `;
}

/** A phrase that appears nowhere in the real knowledge base, so a retrieval
 * hit on it can only be the document this test just wrote. */
const TEST_TITLE = "Test: admin-authored policy";
const MARKER = "Zomlingthang yak-butter festival";

async function main() {
  const agencyId = await getCurrentAgencyId();
  if (!agencyId) throw new Error("no agency configured");

  const before = await prisma.knowledgeDocument.count({ where: { agencyId } });

  // --- create ---
  const created = await ingestDocument({
    agencyId,
    title: TEST_TITLE,
    content:
      `The ${MARKER} runs for three days each autumn in the upper Bumthang valley.\n\n` +
      `Visitors are welcome at the morning dances. Photography inside the shrine is not permitted.\n\n` +
      `There is no entry fee, but a small offering is customary.`,
    sourceType: "POLICY",
    category: "Test",
    visibility: "PUBLIC",
    status: "PUBLISHED",
  });
  check("create returns chunks", created.chunkCount > 0, JSON.stringify(created));
  check("create embeds them", created.embeddedCount === created.chunkCount, JSON.stringify(created));
  check("document count grew by one", (await prisma.knowledgeDocument.count({ where: { agencyId } })) === before + 1);

  // --- retrievable ---
  let found = await retrieveKnowledge({ agencyId, query: "yak butter festival in Bumthang", visibility: ["PUBLIC"] });
  check("a new document is retrievable by a public visitor",
    found.chunks.some((c) => c.content.includes(MARKER)),
    `mode=${found.mode} titles=${found.chunks.map((c) => c.title).join(", ")}`);

  // --- edit: keeps the id, replaces the chunks ---
  const firstChunks = await chunksOf(created.documentId);
  const edited = await reingestDocument({
    documentId: created.documentId,
    title: `${TEST_TITLE} (edited)`,
    content: `The ${MARKER} was moved to spring this year and now runs for two days.`,
    category: null,
    visibility: "PUBLIC",
    status: "PUBLISHED",
  });
  check("editing keeps the same document id", edited.documentId === created.documentId);
  const secondChunks = await chunksOf(created.documentId);
  check("old chunks are gone, not appended",
    secondChunks.every((c) => !firstChunks.some((f) => f.id === c.id)),
    `${firstChunks.length} → ${secondChunks.length}`);
  check("the edit is embedded", secondChunks.every((c) => c.hasVector), JSON.stringify(secondChunks));
  const row = await prisma.knowledgeDocument.findUnique({ where: { id: created.documentId } });
  check("category cleared to null", row?.category === null, String(row?.category));
  check("title updated", Boolean(row?.title.endsWith("(edited)")), row?.title);

  found = await retrieveKnowledge({ agencyId, query: "when is the yak butter festival", visibility: ["PUBLIC"] });
  check("the edited wording is what retrieval now returns",
    found.chunks.some((c) => c.content.includes("moved to spring")) &&
      !found.chunks.some((c) => c.content.includes("three days each autumn")),
    found.chunks.map((c) => c.content.slice(0, 60)).join(" | "));

  // --- visibility change must rewrite the denormalized chunk column ---
  await reingestDocument({
    documentId: created.documentId,
    title: `${TEST_TITLE} (internal)`,
    content: `The ${MARKER} was moved to spring this year and now runs for two days.`,
    category: null,
    visibility: "INTERNAL",
    status: "PUBLISHED",
  });
  const internalChunks = await chunksOf(created.documentId);
  check("chunks follow the document to INTERNAL",
    internalChunks.length > 0 && internalChunks.every((c) => c.visibility === "INTERNAL"),
    JSON.stringify(internalChunks));
  found = await retrieveKnowledge({ agencyId, query: "when is the yak butter festival", visibility: ["PUBLIC"] });
  check("a public visitor can no longer retrieve it",
    !found.chunks.some((c) => c.content.includes(MARKER)),
    found.chunks.map((c) => c.title).join(", "));

  // --- draft must be invisible even to staff retrieval ---
  await reingestDocument({
    documentId: created.documentId,
    title: `${TEST_TITLE} (draft)`,
    content: `The ${MARKER} was moved to spring this year and now runs for two days.`,
    category: null,
    visibility: "PUBLIC",
    status: "DRAFT",
  });
  found = await retrieveKnowledge({ agencyId, query: "when is the yak butter festival", visibility: ["PUBLIC", "INTERNAL"] });
  check("a DRAFT document is never retrieved",
    !found.chunks.some((c) => c.content.includes(MARKER)),
    found.chunks.map((c) => c.title).join(", "));

  // --- delete cascades ---
  await prisma.knowledgeDocument.delete({ where: { id: created.documentId } });
  check("deleting the document deletes its chunks", (await chunksOf(created.documentId)).length === 0);
  check("document count is back where it started",
    (await prisma.knowledgeDocument.count({ where: { agencyId } })) === before);

  console.log(`\n${pass}/${pass + fail} checks passed`);
  if (fail > 0) process.exitCode = 1;
}

main()
  .catch(async (err) => {
    console.error("Test harness crashed:", err);
    // Leave nothing behind on a crash — a stray PUBLIC test document would
    // start coming out of the assistant's mouth on the real site.
    await prisma.knowledgeDocument.deleteMany({ where: { title: { startsWith: TEST_TITLE } } });
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
