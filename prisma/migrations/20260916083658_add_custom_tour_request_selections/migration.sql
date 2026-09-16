-- AlterTable
ALTER TABLE "CustomTourRequest" ADD COLUMN     "estimatedPricePerPerson" DECIMAL(10,2),
ADD COLUMN     "estimatedTotalPrice" DECIMAL(10,2),
ADD COLUMN     "guideId" TEXT,
ADD COLUMN     "roomTypeId" TEXT,
ADD COLUMN     "roomsNeeded" INTEGER,
ADD COLUMN     "vehicleId" TEXT;

-- AddForeignKey
ALTER TABLE "CustomTourRequest" ADD CONSTRAINT "CustomTourRequest_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "GuideProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTourRequest" ADD CONSTRAINT "CustomTourRequest_roomTypeId_fkey" FOREIGN KEY ("roomTypeId") REFERENCES "RoomType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomTourRequest" ADD CONSTRAINT "CustomTourRequest_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;
