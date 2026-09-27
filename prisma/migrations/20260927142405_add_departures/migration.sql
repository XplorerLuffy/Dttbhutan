-- Prisma regenerated the pgvector DROP INDEX again; removed by hand. See
-- 20260927074352_add_site_content for why it recurs on every migration.

-- CreateEnum
CREATE TYPE "DepartureStatus" AS ENUM ('OPEN', 'LIMITED', 'SOLD_OUT', 'CANCELLED');

-- AlterTable
ALTER TABLE "ContactMessage" ADD COLUMN     "departureId" TEXT;

-- CreateTable
CREATE TABLE "Departure" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "priceOverride" DECIMAL(10,2),
    "status" "DepartureStatus" NOT NULL DEFAULT 'OPEN',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Departure_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Departure_itineraryId_startDate_idx" ON "Departure"("itineraryId", "startDate");

-- AddForeignKey
ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_departureId_fkey" FOREIGN KEY ("departureId") REFERENCES "Departure"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Departure" ADD CONSTRAINT "Departure_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
