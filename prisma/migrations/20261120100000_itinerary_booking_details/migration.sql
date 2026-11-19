-- Traveler details collected when booking a scheduled departure (names, dates of
-- birth, nationality, contact, rooms). Nullable and additive: existing bookings
-- keep NULL and nothing is rewritten.
ALTER TABLE "ItineraryBooking" ADD COLUMN "details" JSONB;
