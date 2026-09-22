-- Enable pgvector. Added by hand: Prisma emits the `vector(768)` column
-- below verbatim (it's an `Unsupported()` type in schema.prisma) but has no
-- way to know the extension providing that type has to exist first, so
-- without this line the CREATE TABLE fails with "type vector does not
-- exist". Verified available on both targets: pgvector 0.6.0 locally,
-- 0.8.2 on Supabase — the HNSW index at the bottom needs >= 0.5.0.
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "KnowledgeVisibility" AS ENUM ('PUBLIC', 'INTERNAL');

-- CreateEnum
CREATE TYPE "KnowledgeSourceType" AS ENUM ('MANUAL', 'ARTICLE', 'FAQ', 'POLICY', 'UPLOAD');

-- CreateEnum
CREATE TYPE "KnowledgeStatus" AS ENUM ('DRAFT', 'PUBLISHED');

-- CreateTable
CREATE TABLE "Agency" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Agency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeDocument" (
    "id" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "sourceType" "KnowledgeSourceType" NOT NULL,
    "sourceRef" TEXT,
    "category" TEXT,
    "visibility" "KnowledgeVisibility" NOT NULL DEFAULT 'PUBLIC',
    "status" "KnowledgeStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "KnowledgeDocument_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KnowledgeChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "agencyId" TEXT NOT NULL,
    "visibility" "KnowledgeVisibility" NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(768),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KnowledgeChunk_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agency_slug_key" ON "Agency"("slug");

-- CreateIndex
CREATE INDEX "KnowledgeDocument_agencyId_status_visibility_idx" ON "KnowledgeDocument"("agencyId", "status", "visibility");

-- CreateIndex
CREATE INDEX "KnowledgeChunk_agencyId_visibility_idx" ON "KnowledgeChunk"("agencyId", "visibility");

-- AddForeignKey
ALTER TABLE "KnowledgeDocument" ADD CONSTRAINT "KnowledgeDocument_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES "Agency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KnowledgeChunk" ADD CONSTRAINT "KnowledgeChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "KnowledgeDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Vector similarity index. Added by hand for the same reason as the
-- extension above: Prisma can't index a type it doesn't model. Cosine
-- distance (`<=>`) matches how retrieval.ts queries this column and how
-- nomic-embed-text embeddings are normally compared. HNSW rather than
-- IVFFlat because it needs no training pass over existing rows — it stays
-- correct when the table is empty, which it is at migration time.
CREATE INDEX "KnowledgeChunk_embedding_idx" ON "KnowledgeChunk" USING hnsw ("embedding" vector_cosine_ops);
