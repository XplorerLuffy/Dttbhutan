-- CreateEnum
CREATE TYPE "CabinClass" AS ENUM ('ECONOMY', 'PREMIUM_ECONOMY', 'BUSINESS', 'FIRST');

-- AlterEnum
ALTER TYPE "BookingType" ADD VALUE 'FLIGHT';

-- CreateTable
CREATE TABLE "FlightBooking" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "departureAt" TIMESTAMP(3) NOT NULL,
    "returnAt" TIMESTAMP(3),
    "passengers" INTEGER NOT NULL DEFAULT 1,
    "cabinClass" "CabinClass" NOT NULL DEFAULT 'ECONOMY',
    "airline" TEXT NOT NULL,
    "flightNumber" TEXT NOT NULL,
    "aggregatorProvider" TEXT NOT NULL,
    "aggregatorOfferId" TEXT NOT NULL,
    "pnr" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FlightBooking_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "FlightBooking_bookingId_key" ON "FlightBooking"("bookingId");

-- AddForeignKey
ALTER TABLE "FlightBooking" ADD CONSTRAINT "FlightBooking_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
