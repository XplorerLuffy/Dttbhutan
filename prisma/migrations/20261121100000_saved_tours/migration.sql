-- Wishlist: tours a traveler saved. Additive; nothing existing is touched.
CREATE TABLE "SavedTour" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "itineraryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedTour_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SavedTour_userId_itineraryId_key" ON "SavedTour"("userId", "itineraryId");
CREATE INDEX "SavedTour_userId_createdAt_idx" ON "SavedTour"("userId", "createdAt");

ALTER TABLE "SavedTour" ADD CONSTRAINT "SavedTour_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SavedTour" ADD CONSTRAINT "SavedTour_itineraryId_fkey" FOREIGN KEY ("itineraryId") REFERENCES "Itinerary"("id") ON DELETE CASCADE ON UPDATE CASCADE;
