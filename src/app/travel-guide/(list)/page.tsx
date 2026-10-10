import { pageMetadata } from "@/lib/pageMeta";
import ArticleCard from "@/components/ArticleCard";
import ScrollReveal from "@/components/ScrollReveal";
import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("travelGuide", "/travel-guide");
}

export const dynamic = "force-dynamic";

export default async function TravelGuidePage() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  const content = await getSiteContent();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{content("travelGuide.heading")}</h1>
      {content("travelGuide.intro") && (
        <p className="mb-8 text-sm text-stone-600">{content("travelGuide.intro")}</p>
      )}

      {articles.length === 0 ? (
        <p className="text-stone-600">No articles published yet.</p>
      ) : (
        <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((a) => (
            <ArticleCard
              key={a.id}
              href={`/travel-guide/${a.slug}`}
              coverPhotoUrl={a.coverPhotoUrl}
              category={a.category}
              title={a.title}
              excerpt={a.excerpt}
              readMinutes={a.readMinutes}
            />
          ))}
        </ScrollReveal>
      )}
    </div>
  );
}
