-- CreateTable
CREATE TABLE "ContactReply" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "toEmail" TEXT NOT NULL,
    "sentById" TEXT,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactReply_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactReply_messageId_createdAt_idx" ON "ContactReply"("messageId", "createdAt");

-- AddForeignKey
ALTER TABLE "ContactReply" ADD CONSTRAINT "ContactReply_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "ContactMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactReply" ADD CONSTRAINT "ContactReply_sentById_fkey" FOREIGN KEY ("sentById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
