-- CreateTable
CREATE TABLE "ExchangeRate" (
    "currency" TEXT NOT NULL,
    "btnPerUnit" DECIMAL(12,4) NOT NULL,
    "source" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("currency")
);
