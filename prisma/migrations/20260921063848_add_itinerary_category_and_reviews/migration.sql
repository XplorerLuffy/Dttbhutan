-- CreateEnum
CREATE TYPE "ItineraryCategory" AS ENUM ('TREKKING', 'CULTURAL', 'WILDLIFE', 'HONEYMOON');

-- AlterEnum
ALTER TYPE "ReviewTargetType" ADD VALUE 'ITINERARY';

-- AlterTable
ALTER TABLE "Itinerary" ADD COLUMN     "category" "ItineraryCategory" NOT NULL DEFAULT 'CULTURAL';
