import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { siteUrl } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * Only lists things a search engine should actually index: public, published
 * content. Dashboards, admin pages, auth pages and the per-trip tracking
 * links are excluded here and disallowed in robots.ts — a shared tracking
 * URL showing a vehicle's live location has no business in a search index.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/destinations`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/packages`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/guides`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/hotels`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/vehicles`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/flights`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/custom-tour`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/travel-guide`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.6 },
    { url: `${base}/contact`, changeFrequency: "yearly", priority: 0.7 },
    { url: `${base}/faq`, changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/terms`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${base}/cancellation`, changeFrequency: "yearly", priority: 0.4 },
  ];

  try {
    const [destinations, packages, articles, guides, hotels] = await Promise.all([
      prisma.destination.findMany({ select: { slug: true } }),
      prisma.itinerary.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.guideProfile.findMany({
        where: { status: "APPROVED" },
        select: { id: true, updatedAt: true },
      }),
      prisma.hotel.findMany({
        where: { status: "APPROVED" },
        select: { id: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...destinations.map((d) => ({
        url: `${base}/destinations/${d.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.8,
      })),
      ...packages.map((p) => ({
        url: `${base}/packages/${p.slug}`,
        lastModified: p.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.9,
      })),
      ...articles.map((a) => ({
        url: `${base}/travel-guide/${a.slug}`,
        lastModified: a.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.7,
      })),
      ...guides.map((g) => ({
        url: `${base}/guides/${g.id}`,
        lastModified: g.updatedAt,
        changeFrequency: "monthly" as const,
        priority: 0.6,
      })),
      ...hotels.map((h) => ({
        url: `${base}/hotels/${h.id}`,
        lastModified: h.updatedAt,
        changeFrequency: "weekly" as const,
        priority: 0.6,
      })),
    ];
  } catch (err) {
    // A database blip shouldn't serve a broken sitemap — fall back to the
    // static routes, which are always valid.
    console.error("[sitemap] failed to load dynamic routes", err);
    return staticRoutes;
  }
}
