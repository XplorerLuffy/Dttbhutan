-- NOTE: Prisma regenerates a `DROP INDEX "KnowledgeChunk_embedding_idx"`
-- at the top of every migration, because the HNSW index on that table's
-- `vector(768)` column is created by raw SQL that Prisma's schema cannot
-- describe. It has been removed here by hand — leaving it in silently
-- drops the vector index and turns every RAG lookup into a sequential
-- scan. Check for it again on the next migration.

-- AlterTable
ALTER TABLE "ItineraryDay" ADD COLUMN     "hikeAscentM" INTEGER,
ADD COLUMN     "hikeDescentM" INTEGER,
ADD COLUMN     "hikeDifficulty" "TripDifficulty",
ADD COLUMN     "hikeDistanceKm" DECIMAL(5,1),
ADD COLUMN     "hikeHours" DECIMAL(3,1),
ADD COLUMN     "hikeNote" TEXT,
ADD COLUMN     "lodgingId" TEXT;

-- CreateTable
CREATE TABLE "ItineraryLodging" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "description" TEXT,
    "photoUrl" TEXT,

    CONSTRAINT "ItineraryLodging_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItineraryLodging_itineraryId_position_idx" ON "ItineraryLodging"("itineraryId", "position");

-- AddForeignKey
ALTER TABLE "ItineraryLodging" ADD CONSTRAINT "ItineraryLodging_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_lodgingId_fkey" FOREIGN KEY ("lodgingId") REFERENCES "ItineraryLodging"("id") ON DELETE SET NULL ON UPDATE CASCADE;
