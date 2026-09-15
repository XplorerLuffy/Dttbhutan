/*
  Warnings:

  - You are about to drop the column `location` on the `Hotel` table. All the data in the column will be lost.
  - Added the required column `destinationId` to the `Hotel` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "DzongkhagRegion" AS ENUM ('WEST', 'CENTRAL', 'EAST');

-- CreateEnum
CREATE TYPE "ItineraryStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "TripDifficulty" AS ENUM ('EASY', 'MODERATE', 'CHALLENGING');

-- CreateEnum
CREATE TYPE "CustomTourRequestStatus" AS ENUM ('NEW', 'IN_REVIEW', 'QUOTED', 'CLOSED');

-- AlterEnum
ALTER TYPE "BookingType" ADD VALUE 'ITINERARY';

-- AlterTable
ALTER TABLE "Hotel" DROP COLUMN "location",
ADD COLUMN     "destinationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Destination" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "region" "DzongkhagRegion" NOT NULL,
    "description" TEXT,
    "highlights" TEXT[],
    "photoUrl" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Itinerary" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "description" TEXT,
    "durationDays" INTEGER NOT NULL,
    "pricePerPerson" DECIMAL(10,2) NOT NULL,
    "maxGroupSize" INTEGER,
    "difficulty" "TripDifficulty" NOT NULL DEFAULT 'EASY',
    "status" "ItineraryStatus" NOT NULL DEFAULT 'DRAFT',
    "coverPhotoUrl" TEXT,
    "includes" TEXT[],
    "excludes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Itinerary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryDay" (
    "id" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "dayNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "destinationId" TEXT,
    "activities" TEXT[],
    "mealsIncluded" TEXT[],

    CONSTRAINT "ItineraryDay_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ItineraryBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "travelers" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ItineraryBooking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomTourRequest" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "travelers" INTEGER NOT NULL DEFAULT 1,
    "budgetPerPerson" DECIMAL(10,2),
    "notes" TEXT,
    "status" "CustomTourRequestStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomTourRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_GuideCoverage" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_GuideCoverage_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_CustomTourDestinations" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CustomTourDestinations_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "Destination_name_key" ON "Destination"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Itinerary_slug_key" ON "Itinerary"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryDay_itineraryId_dayNumber_key" ON "ItineraryDay"("itineraryId", "dayNumber");

-- CreateIndex
CREATE UNIQUE INDEX "ItineraryBooking_bookingId_key" ON "ItineraryBooking"("bookingId");

-- CreateIndex
CREATE INDEX "_GuideCoverage_B_index" ON "_GuideCoverage"("B");

-- CreateIndex
CREATE INDEX "_CustomTourDestinations_B_index" ON "_CustomTourDestinations"("B");

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryDay" ADD CONSTRAINT "ItineraryDay_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryBooking" ADD CONSTRAINT "ItineraryBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItineraryBooking" ADD CONSTRAINT "ItineraryBooking_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTourRequest" ADD CONSTRAINT "CustomTourRequest_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideCoverage" ADD CONSTRAINT "_GuideCoverage_A_fkey" FOREIGN KEY ("A") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_GuideCoverage" ADD CONSTRAINT "_GuideCoverage_B_fkey" FOREIGN KEY ("B") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomTourDestinations" ADD CONSTRAINT "_CustomTourDestinations_A_fkey" FOREIGN KEY ("A") REFERENCES "CustomTourRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CustomTourDestinations" ADD CONSTRAINT "_CustomTourDestinations_B_fkey" FOREIGN KEY ("B") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;
