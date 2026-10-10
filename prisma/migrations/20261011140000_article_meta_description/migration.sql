ALTER TABLE "Article" ADD COLUMN "metaDescription" TEXT;

UPDATE "Article" SET "metaDescription" = $d$Bhutan visa and entry requirements: why you need a licensed operator, how the visa is arranged in advance, and what to prepare before you travel.$d$ WHERE "slug" = 'visa-and-entry-requirements-for-bhutan' AND "metaDescription" IS NULL;
UPDATE "Article" SET "metaDescription" = $d$Bhutan's Sustainable Development Fee explained: what the daily fee covers, what it funds, and how it fits into the total cost of your trip.$d$ WHERE "slug" = 'bhutans-sustainable-development-fee-explained' AND "metaDescription" IS NULL;
UPDATE "Article" SET "metaDescription" = $d$Best time to visit Bhutan: spring and autumn bring the clearest views, comfortable weather and the main festivals. Season-by-season guidance for planning.$d$ WHERE "slug" = 'best-time-to-visit-bhutan' AND "metaDescription" IS NULL;
