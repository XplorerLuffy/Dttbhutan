-- NOTE: Prisma regenerates a `DROP INDEX "KnowledgeChunk_embedding_idx"`
-- at the top of every migration, because the HNSW index on that table's
-- `vector(768)` column is created by raw SQL that Prisma's schema cannot
-- describe. It has been removed here by hand — leaving it in silently
-- drops the vector index and turns every RAG lookup into a sequential
-- scan. Check for it again on the next migration.

-- CreateTable
CREATE TABLE "ItineraryPhoto" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "url" TEXT NOT NULL,
    "caption" TEXT,

    CONSTRAINT "ItineraryPhoto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItineraryPhoto_itineraryId_position_idx" ON "ItineraryPhoto"("itineraryId", "position");

-- AddForeignKey
ALTER TABLE "ItineraryPhoto" ADD CONSTRAINT "ItineraryPhoto_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
