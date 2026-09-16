import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuideBookingForm from "@/components/booking/GuideBookingForm";
import ReviewList from "@/components/ReviewList";
import RatingBadge from "@/components/listing/RatingBadge";
import DetailGallery from "@/components/listing/DetailGallery";
import Money from "@/components/Money";

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
