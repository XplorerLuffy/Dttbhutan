import Image from "next/image";
import MotionCard from "@/components/MotionCard";
import ScrollReveal from "@/components/ScrollReveal";
import { prisma } from "@/lib/prisma";

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
            <MotionCard key={a.id} href={`/travel-guide/${a.slug}`} className="card block overflow-hidden">
              {a.coverPhotoUrl ? (
                <div className="-mx-4 -mt-4 mb-3 h-36 w-[calc(100%+2rem)] overflow-hidden">
                  <Image
                    src={a.coverPhotoUrl}
                    alt={a.title}
                    width={400}
                    height={200}
                    unoptimized
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="-mx-4 -mt-4 mb-3 flex h-36 w-[calc(100%+2rem)] items-center justify-center bg-gradient-to-br from-brand-600 to-brand-900">
                  <span className="font-display text-3xl text-white/30">{a.title[0]}</span>
                </div>
              )}
              <span className="badge bg-stone-100 text-stone-600">{a.category.toUpperCase()}</span>
              <h2 className="mt-2 font-display text-lg font-semibold text-stone-900">{a.title}</h2>
              <p className="mt-1 line-clamp-2 text-sm text-stone-600">{a.excerpt}</p>
              <p className="mt-2 text-xs text-stone-400">{a.readMinutes} min read</p>
            </MotionCard>
          ))}
        </ScrollReveal>
      )}
    </div>
  );
}
