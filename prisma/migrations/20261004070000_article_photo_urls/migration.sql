-- AlterTable
ALTER TABLE "Article" ADD COLUMN     "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
