import ArticleCard from "@/components/ArticleCard";
import ScrollReveal from "@/components/ScrollReveal";
import { prisma } from "@/lib/prisma";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bhutan travel guide",
  description:
    "Practical answers about visiting Bhutan — visas, the Sustainable Development Fee, when to go, and what to expect on the ground.",
  alternates: { canonical: "/travel-guide" },
};

export const dynamic = "force-dynamic";

export default async function TravelGuidePage() {
  const articles = await prisma.article.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Travel Guide</h1>
      <p className="mb-8 text-sm text-stone-600">
        Practical answers to the questions travelers ask us most — visas, fees, timing, and what to expect on the ground in Bhutan.
      </p>

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
