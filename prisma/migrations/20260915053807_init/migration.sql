-- CreateEnum
CREATE TYPE "Role" AS ENUM ('TRAVELER', 'GUIDE', 'HOTEL_OPERATOR', 'TRANSPORT_OPERATOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "VendorStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "VehicleType" AS ENUM ('SEDAN', 'SUV', 'VAN', 'BUS');

-- CreateEnum
CREATE TYPE "BookingType" AS ENUM ('GUIDE', 'HOTEL', 'VEHICLE');

-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'MOBILE_WALLET', 'CASH');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'REFUNDED', 'FAILED');

-- CreateEnum
CREATE TYPE "ReviewTargetType" AS ENUM ('GUIDE', 'HOTEL', 'VEHICLE');

-- CreateEnum
CREATE TYPE "GpsDeviceStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "TripStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'TRAVELER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "licenseNumber" TEXT NOT NULL,
    "languages" TEXT[],
    "specialties" TEXT[],
    "yearsExperience" INTEGER NOT NULL DEFAULT 0,
    "ratePerDay" DECIMAL(10,2) NOT NULL,
    "bio" TEXT,
    "photoUrl" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideBlockedDate" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GuideBlockedDate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotel" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "location" TEXT NOT NULL,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "amenities" TEXT[],
    "photoUrls" TEXT[],
    "businessLicenseUrl" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Hotel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomType" (
    "id" TEXT NOT NULL,
    "hotelId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "pricePerNight" DECIMAL(10,2) NOT NULL,
    "totalRooms" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportOperator" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "businessName" TEXT NOT NULL,
    "businessLicenseUrl" TEXT,
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportOperator_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "operatorId" TEXT NOT NULL,
    "type" "VehicleType" NOT NULL,
    "capacity" INTEGER NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "driverName" TEXT NOT NULL,
    "driverLicenseNumber" TEXT NOT NULL,
    "ratePerDay" DECIMAL(10,2) NOT NULL,
    "ratePerKm" DECIMAL(10,2),
    "status" "VendorStatus" NOT NULL DEFAULT 'PENDING',
    "adminNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "type" "BookingType" NOT NULL,
    "status" "BookingStatus" NOT NULL DEFAULT 'PENDING',
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DECIMAL(10,2) NOT NULL,
    "commissionRate" DECIMAL(5,4) NOT NULL DEFAULT 0.10,
    "guideId" TEXT,
    "roomTypeId" TEXT,
    "vehicleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "commissionAmount" DECIMAL(10,2) NOT NULL,
    "method" "PaymentMethod" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "travelerId" TEXT NOT NULL,
    "targetType" "ReviewTargetType" NOT NULL,
    "targetId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpsDevice" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "deviceIdentifier" TEXT NOT NULL,
    "protocol" TEXT,
    "status" "GpsDeviceStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GpsDevice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trip" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "status" "TripStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "plannedDistanceKm" DOUBLE PRECISION NOT NULL,
    "plannedRoute" JSONB NOT NULL,
    "startedAt" TIMESTAMP(3),
    "endedAt" TIMESTAMP(3),
    "shareToken" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GpsPosition" (
    "id" TEXT NOT NULL,
    "deviceId" TEXT NOT NULL,
    "tripId" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "speedKmh" DOUBLE PRECISION,
    "heading" DOUBLE PRECISION,
    "recordedAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GpsPosition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripDistanceReport" (
    "id" TEXT NOT NULL,
    "tripId" TEXT NOT NULL,
    "actualDistanceKm" DOUBLE PRECISION NOT NULL,
    "plannedDistanceKm" DOUBLE PRECISION NOT NULL,
    "deviationKm" DOUBLE PRECISION NOT NULL,
    "deviationPercent" DOUBLE PRECISION NOT NULL,
    "flagged" BOOLEAN NOT NULL,
    "flagReason" TEXT,
    "startLatitude" DOUBLE PRECISION,
    "startLongitude" DOUBLE PRECISION,
    "endLatitude" DOUBLE PRECISION,
    "endLongitude" DOUBLE PRECISION,
    "pointCount" INTEGER NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripDistanceReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "GuideProfile_userId_key" ON "GuideProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "GuideBlockedDate_guideId_date_key" ON "GuideBlockedDate"("guideId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "Hotel_ownerId_key" ON "Hotel"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "TransportOperator_ownerId_key" ON "TransportOperator"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_plateNumber_key" ON "Vehicle"("plateNumber");

-- CreateIndex
CREATE INDEX "Booking_guideId_startDate_endDate_idx" ON "Booking"("guideId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_roomTypeId_startDate_endDate_idx" ON "Booking"("roomTypeId", "startDate", "endDate");

-- CreateIndex
CREATE INDEX "Booking_vehicleId_startDate_endDate_idx" ON "Booking"("vehicleId", "startDate", "endDate");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_bookingId_key" ON "Payment"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_bookingId_key" ON "Review"("bookingId");

-- CreateIndex
CREATE INDEX "Review_targetType_targetId_idx" ON "Review"("targetType", "targetId");

-- CreateIndex
CREATE INDEX "Message_bookingId_createdAt_idx" ON "Message"("bookingId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "GpsDevice_vehicleId_key" ON "GpsDevice"("vehicleId");

-- CreateIndex
CREATE UNIQUE INDEX "GpsDevice_deviceIdentifier_key" ON "GpsDevice"("deviceIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_bookingId_key" ON "Trip"("bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "Trip_shareToken_key" ON "Trip"("shareToken");

-- CreateIndex
CREATE INDEX "Trip_vehicleId_status_idx" ON "Trip"("vehicleId", "status");

-- CreateIndex
CREATE INDEX "GpsPosition_tripId_recordedAt_idx" ON "GpsPosition"("tripId", "recordedAt");

-- CreateIndex
CREATE INDEX "GpsPosition_deviceId_recordedAt_idx" ON "GpsPosition"("deviceId", "recordedAt");

-- CreateIndex
CREATE UNIQUE INDEX "TripDistanceReport_tripId_key" ON "TripDistanceReport"("tripId");

-- AddForeignKey
ALTER TABLE "GuideProfile" ADD CONSTRAINT "GuideProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideBlockedDate" ADD CONSTRAINT "GuideBlockedDate_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hotel" ADD CONSTRAINT "Hotel_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomType" ADD CONSTRAINT "RoomType_hotelId_fkey" FOREIGN KEY ("hotelId") REFERENCES "Hotel"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportOperator" ADD CONSTRAINT "TransportOperator_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_operatorId_fkey" FOREIGN KEY ("operatorId") REFERENCES "TransportOperator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_travelerId_fkey" FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsDevice" ADD CONSTRAINT "GpsDevice_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Trip" ADD CONSTRAINT "Trip_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsPosition" ADD CONSTRAINT "GpsPosition_deviceId_fkey" FOREIGN KEY ("deviceId") REFERENCES "GpsDevice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GpsPosition" ADD CONSTRAINT "GpsPosition_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripDistanceReport" ADD CONSTRAINT "TripDistanceReport_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE CASCADE ON UPDATE CASCADE;
