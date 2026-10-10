import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import TripGallery from "@/components/listing/TripGallery";
import { articleJsonLd, breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";

/** Cached for five minutes so the page opens instantly; admin edits clear it at once (see lib/revalidate.ts). */
export const revalidate = 300;

/**
 * Nothing is built ahead of time, but declaring this is what lets Next keep
 * each page after its first visit (a route with a dynamic segment and no
 * generateStaticParams is otherwise rendered fresh for every request).
 */
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || article.status !== "PUBLISHED") return { title: "Article not found" };

  const description = article.metaDescription?.trim() || article.excerpt.slice(0, 160);

  return {
    title: article.title,
    description,
    alternates: { canonical: `/travel-guide/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description,
      url: `/travel-guide/${article.slug}`,
      publishedTime: article.createdAt.toISOString(),
      modifiedTime: article.updatedAt.toISOString(),
      images: [article.coverPhotoUrl ?? DEFAULT_OG_IMAGE],
    },
  };
}

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const article = await prisma.article.findUnique({ where: { slug } });
  if (!article || article.status !== "PUBLISHED") notFound();

  const paragraphs = article.content.split(/\n\s*\n/).filter(Boolean);

  return (
    <article className="mx-auto max-w-2xl">
      <JsonLd
        data={[
          articleJsonLd(article),
          breadcrumbJsonLd([
            { name: "Travel guide", path: "/travel-guide" },
            { name: article.title, path: `/travel-guide/${article.slug}` },
          ]),
        ]}
      />
      <Link href="/travel-guide" className="text-sm text-brand-700 hover:underline">
        ← Travel Guide
      </Link>

      {article.coverPhotoUrl ? (
        <div className="relative mt-4 h-64 w-full overflow-hidden rounded-lg">
          <Image src={article.coverPhotoUrl} alt={`${article.title}: Bhutan travel guide, ${article.category}`} fill unoptimized className="object-cover" />
        </div>
      ) : (
        <div className="mt-4 flex h-64 w-full items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900">
          <span className="font-display text-5xl text-white/30">{article.title[0]}</span>
        </div>
      )}

      <span className="badge mt-4 inline-block bg-stone-100 text-stone-600">{article.category.toUpperCase()}</span>
      <h1 className="mt-2 text-3xl font-bold">{article.title}</h1>
      <p className="mt-2 text-sm text-stone-400">{article.readMinutes} min read</p>

      <div className="mt-6">
        {paragraphs.map((p, i) => (
          <p key={i} className="mb-4 leading-relaxed text-stone-700">
            {p}
          </p>
        ))}
      </div>

      {article.photoUrls.length > 0 && (
        <section className="mt-8" aria-label="Photos">
          <TripGallery
            photos={article.photoUrls.map((url, i) => ({ id: `${i}`, url, caption: null }))}
            subject={`${article.title}, Bhutan travel guide`}
          />
        </section>
      )}

      <div className="mt-10 rounded-lg border border-stone-200 bg-stone-50 p-5 text-center">
        <p className="font-display text-lg font-semibold text-stone-900">Planning a trip to Bhutan?</p>
        <p className="mt-1 text-sm text-stone-600">
          Browse our tour packages, or tell us what you have in mind and we&apos;ll build a custom itinerary.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link href="/packages" className="btn-secondary">
            Browse packages
          </Link>
          <Link href="/custom-tour" className="btn-primary">
            Request a custom tour
          </Link>
        </div>
      </div>
    </article>
  );
}
