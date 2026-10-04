import "server-only";
import { prisma } from "@/lib/prisma";
import { getEmbeddingProvider } from "@/lib/ai/embeddingProvider";
import type { KnowledgeSourceType, KnowledgeVisibility, KnowledgeStatus } from "@prisma/client";

/**
 * Document → text → chunks → embeddings → KnowledgeChunk rows.
 *
 * Format handling stops at plain text on purpose. TXT and Markdown are
 * already plain text; PDF and DOC/DOCX are deliberately NOT implemented in
 * this phase — each needs a parsing dependency with its own failure modes
 * (encrypted PDFs, scanned images with no text layer, macro-bearing .doc),
 * and the brief explicitly prefers documenting a gap over adding fragile
 * dependencies. The seam is clean: anything that can produce a string can
 * call `ingestDocument` unchanged, so adding PDF support later is one
 * extract-to-text function, not a rework of this pipeline.
 */

/** Target characters per chunk. Roughly a few paragraphs — large enough to
 * keep an answer's context together, small enough that five of them don't
 * crowd out the conversation in the model's context window. */
const TARGET_CHUNK_CHARS = 900;

/** Overlap between consecutive chunks, so a sentence spanning a boundary
 * still appears whole in at least one chunk. */
const CHUNK_OVERLAP_CHARS = 120;

/** Hard ceiling on a single document. Guards against someone pasting a
 * 40MB text dump and generating thousands of embedding calls. */
const MAX_DOCUMENT_CHARS = 200_000;

export class DocumentTooLargeError extends Error {}

/**
 * Splits on paragraph boundaries where possible, falling back to hard
 * character windows for a single enormous paragraph. Intentionally simple:
 * no tokenizer, no NLP dependency, no per-model token counting — chunk
 * quality matters far less here than tenant/visibility correctness, and
 * this keeps the pipeline dependency-free.
 */
export function chunkText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!normalized) return [];

  const paragraphs = normalized.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    if (paragraph.length > TARGET_CHUNK_CHARS) {
      if (current) {
        chunks.push(current.trim());
        current = "";
      }
      for (let i = 0; i < paragraph.length; i += TARGET_CHUNK_CHARS - CHUNK_OVERLAP_CHARS) {
        chunks.push(paragraph.slice(i, i + TARGET_CHUNK_CHARS).trim());
      }
      continue;
    }

    if (current.length + paragraph.length + 2 > TARGET_CHUNK_CHARS) {
      chunks.push(current.trim());
      const tail = current.slice(-CHUNK_OVERLAP_CHARS);
      current = `${tail}\n\n${paragraph}`;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks.filter((c) => c.length > 0);
}

export type IngestDocumentArgs = {
  agencyId: string;
  title: string;
  content: string;
  sourceType: KnowledgeSourceType;
  sourceRef?: string;
  category?: string;
  visibility: KnowledgeVisibility;
  status?: KnowledgeStatus;
};

export type IngestResult = {
  documentId: string;
  chunkCount: number;
  embeddedCount: number;
  /** Set when chunks were stored without embeddings because no embedding
   * provider was reachable. They're still findable via the text-search
   * fallback, and re-running ingestion once a provider is up fills them in. */
  embeddingSkippedReason?: string;
};

/**
 * Creates (or replaces) one knowledge document and its chunks.
 *
 * Replace-by-sourceRef rather than append: re-ingesting an edited article
 * should leave one current copy, not two contradictory ones the assistant
 * might cite against each other.
 */
export async function ingestDocument(args: IngestDocumentArgs): Promise<IngestResult> {
  if (args.content.length > MAX_DOCUMENT_CHARS) {
    throw new DocumentTooLargeError(
      `Document "${args.title}" is ${args.content.length} characters; the limit is ${MAX_DOCUMENT_CHARS}.`
    );
  }

  if (args.sourceRef) {
    await prisma.knowledgeDocument.deleteMany({
      where: { agencyId: args.agencyId, sourceType: args.sourceType, sourceRef: args.sourceRef },
    });
  }

  const document = await prisma.knowledgeDocument.create({
    data: {
      agencyId: args.agencyId,
      title: args.title,
      content: args.content,
      sourceType: args.sourceType,
      sourceRef: args.sourceRef,
      category: args.category,
      visibility: args.visibility,
      status: args.status ?? "PUBLISHED",
    },
  });

  const rebuilt = await rebuildChunks({
    documentId: document.id,
    agencyId: args.agencyId,
    visibility: args.visibility,
    content: args.content,
  });

  return { documentId: document.id, ...rebuilt };
}

export type ReingestDocumentArgs = {
  documentId: string;
  title: string;
  content: string;
  category?: string | null;
  visibility: KnowledgeVisibility;
  status: KnowledgeStatus;
};

/**
 * Rewrites an existing document in place and rebuilds its chunks.
 *
 * Distinct from ingestDocument's replace-by-sourceRef, which deletes the old
 * row and creates a new one: an admin editing knowledge through the dashboard
 * is looking at /chim/knowledge/<id>/edit, and a new id would leave them on
 * a dead URL after every save. Keeping the id also keeps the edit history
 * readable — one row whose updatedAt moves, rather than a fresh row each time.
 *
 * Chunks are always rebuilt, never patched, and that includes a visibility-only
 * change: KnowledgeChunk carries its own copy of `visibility` because retrieval
 * filters on the chunk row (see the schema comment), so leaving stale chunks
 * behind after a PUBLIC → INTERNAL edit would keep serving the old text to
 * anonymous visitors.
 */
export async function reingestDocument(args: ReingestDocumentArgs): Promise<IngestResult> {
  if (args.content.length > MAX_DOCUMENT_CHARS) {
    throw new DocumentTooLargeError(
      `Document "${args.title}" is ${args.content.length} characters; the limit is ${MAX_DOCUMENT_CHARS}.`
    );
  }

  const document = await prisma.knowledgeDocument.update({
    where: { id: args.documentId },
    data: {
      title: args.title,
      content: args.content,
      category: args.category ?? null,
      visibility: args.visibility,
      status: args.status,
    },
    select: { id: true, agencyId: true },
  });

  await prisma.knowledgeChunk.deleteMany({ where: { documentId: document.id } });

  const rebuilt = await rebuildChunks({
    documentId: document.id,
    agencyId: document.agencyId,
    visibility: args.visibility,
    content: args.content,
  });

  return { documentId: document.id, ...rebuilt };
}

/**
 * Chunks the text, stores each piece, and embeds it. Shared by first-time
 * ingestion and re-ingestion so both produce identical chunk boundaries — a
 * saved edit has to be searchable the same way a seeded document is.
 *
 * Embeddings are best-effort by design: a chunk with no vector is still found
 * by retrieval's text-search fallback, so an unreachable provider degrades the
 * answer rather than losing the content.
 */
async function rebuildChunks({
  documentId,
  agencyId,
  visibility,
  content,
}: {
  documentId: string;
  agencyId: string;
  visibility: KnowledgeVisibility;
  content: string;
}): Promise<Omit<IngestResult, "documentId">> {
  const pieces = chunkText(content);
  let embeddedCount = 0;
  let embeddingSkippedReason: string | undefined;

  for (let index = 0; index < pieces.length; index++) {
    const piece = pieces[index];
    const chunk = await prisma.knowledgeChunk.create({
      data: { documentId, agencyId, visibility, content: piece, chunkIndex: index },
    });

    // Once the provider has failed, stop retrying it for every remaining
    // chunk of this document — one unreachable-service error is enough.
    if (embeddingSkippedReason) continue;

    try {
      const embedding = await getEmbeddingProvider().embed(piece, "document");
      await setChunkEmbedding(chunk.id, embedding);
      embeddedCount++;
    } catch (err) {
      embeddingSkippedReason = err instanceof Error ? err.message : String(err);
      console.warn(`[ai] storing chunks without embeddings: ${embeddingSkippedReason}`);
    }
  }

  return { chunkCount: pieces.length, embeddedCount, embeddingSkippedReason };
}

/**
 * Writes the vector column. Raw SQL for the same reason retrieval reads it
 * that way — Prisma's typed client can't set an `Unsupported` column.
 */
export async function setChunkEmbedding(chunkId: string, embedding: number[]): Promise<void> {
  const vectorLiteral = `[${embedding.join(",")}]`;
  await prisma.$executeRaw`
    UPDATE "KnowledgeChunk"
    SET "embedding" = ${vectorLiteral}::vector
    WHERE "id" = ${chunkId}
  `;
}
