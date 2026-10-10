import { guideMeta } from "@/lib/metaDescriptions";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuideBookingForm from "@/components/booking/GuideBookingForm";
import ReviewList from "@/components/ReviewList";
import RatingBadge from "@/components/listing/RatingBadge";
import DetailGallery from "@/components/listing/DetailGallery";
import Money from "@/components/Money";
import JsonLd from "@/components/JsonLd";
import { breadcrumbJsonLd, DEFAULT_OG_IMAGE } from "@/lib/seo";
import type { Metadata } from "next";

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
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const guide = await prisma.guideProfile.findUnique({
    where: { id },
    select: {
      status: true,
      bio: true,
      metaDescription: true,
      languages: true,
      specialties: true,
      yearsExperience: true,
      photoUrl: true,
      user: { select: { name: true } },
    },
  });
  if (!guide || guide.status !== "APPROVED") return { title: "Guide not found" };

  const title = `${guide.user.name} — Licensed Bhutan Tour Guide`;
  const description = guideMeta({
    name: guide.user.name,
    metaDescription: guide.metaDescription,
    yearsExperience: guide.yearsExperience,
    specialties: guide.specialties,
    languages: guide.languages,
  });

  return {
    title,
    description,
    alternates: { canonical: `/guides/${id}` },
    openGraph: {
      title,
      description,
      url: `/guides/${id}`,
      images: [guide.photoUrl ?? DEFAULT_OG_IMAGE],
    },
  };
}

export default async function GuideDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const guide = await prisma.guideProfile.findUnique({
    where: { id },
    include: { user: true },
  });

  if (!guide || guide.status !== "APPROVED") notFound();

  const [reviews, ratingAgg] = await Promise.all([
    prisma.review.findMany({
      where: { targetType: "GUIDE", targetId: guide.id },
      orderBy: { createdAt: "desc" },
      include: { traveler: true },
    }),
    prisma.review.aggregate({
      where: { targetType: "GUIDE", targetId: guide.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Tour guides", path: "/guides" },
          { name: guide.user.name, path: `/guides/${guide.id}` },
        ])}
      />
      <DetailGallery photos={[guide.photoUrl]} label={guide.user.name} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold">{guide.user.name}</h1>
          <p className="mt-1 text-stone-600">
            {guide.languages.join(", ")} · {guide.yearsExperience} yrs experience
          </p>
          <p className="mt-1 text-xs text-stone-400">TCB license: {guide.licenseNumber}</p>

          <div className="mt-3">
            <RatingBadge average={ratingAgg._avg.rating} count={ratingAgg._count.rating} />
          </div>

          {guide.specialties.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {guide.specialties.map((s) => (
                <span key={s} className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                  {s}
                </span>
              ))}
            </div>
          )}

          {guide.bio && <p className="mt-4 text-stone-700">{guide.bio}</p>}

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
            <ReviewList reviews={reviews} />
          </div>
        </div>

        <div className="sticky-booking-card">
          <div className="price-summary-card">
            <p className="text-2xl font-bold text-brand-800">
              <Money btn={Number(guide.ratePerDay)} />
            </p>
            <p className="text-xs text-stone-500">per day</p>
          </div>
          <GuideBookingForm guideId={guide.id} />
        </div>
      </div>
    </div>
  );
}
