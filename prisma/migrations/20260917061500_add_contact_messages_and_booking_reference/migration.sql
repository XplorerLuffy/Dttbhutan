-- Contact / enquiry messages from the public site (no account required).
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED');

CREATE TABLE "ContactMessage" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "subject" TEXT,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "adminNote" TEXT,
    "travelerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContactMessage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ContactMessage_status_createdAt_idx" ON "ContactMessage"("status", "createdAt");

ALTER TABLE "ContactMessage" ADD CONSTRAINT "ContactMessage_travelerId_fkey"
    FOREIGN KEY ("travelerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Human-quotable booking references. Added nullable first so existing rows can
-- be backfilled, then tightened to NOT NULL + UNIQUE. Existing bookings get
-- sequential legacy references; new ones get random codes from the app.
ALTER TABLE "Booking" ADD COLUMN "reference" TEXT;

WITH numbered AS (
    SELECT "id", ROW_NUMBER() OVER (ORDER BY "createdAt", "id") AS rn
    FROM "Booking"
)
UPDATE "Booking" b
SET "reference" = 'DTT-' || LPAD(numbered.rn::text, 6, '0')
FROM numbered
WHERE b."id" = numbered."id";

ALTER TABLE "Booking" ALTER COLUMN "reference" SET NOT NULL;

CREATE UNIQUE INDEX "Booking_reference_key" ON "Booking"("reference");
