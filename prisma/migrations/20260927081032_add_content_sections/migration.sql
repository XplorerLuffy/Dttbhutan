-- Prisma regenerated `DROP INDEX "KnowledgeChunk_embedding_idx"` here and it
-- has been removed by hand again. See 20260927074352_add_site_content: the
-- pgvector HNSW index cannot be expressed in schema.prisma, so every
-- migration reads it as drift. Dropping it does not break queries, it just
-- turns vector search into a sequential scan.

-- CreateTable
CREATE TABLE "ContentSection" (
    "id" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "group" TEXT,
    "heading" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContentSection_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContentSection_page_position_idx" ON "ContentSection"("page", "position");
