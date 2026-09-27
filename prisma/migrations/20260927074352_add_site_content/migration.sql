-- ⚠️ Prisma generated a `DROP INDEX "KnowledgeChunk_embedding_idx"` here and
-- it has been removed by hand. That index is the pgvector HNSW index created
-- in 20260922171403_add_rag_knowledge_layer. It cannot be expressed in
-- schema.prisma (Prisma has no vector index type), so every future
-- `prisma migrate dev` will believe it is drift and try to drop it again.
-- Delete that line each time. Dropping it does not break queries — it makes
-- them silently fall back to a sequential scan over every chunk.

-- CreateTable
CREATE TABLE "SiteContent" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedBy" TEXT,

    CONSTRAINT "SiteContent_pkey" PRIMARY KEY ("key")
);
