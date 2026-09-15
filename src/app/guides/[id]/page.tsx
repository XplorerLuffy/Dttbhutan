import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import GuideBookingForm from "@/components/booking/GuideBookingForm";
import ReviewList from "@/components/ReviewList";

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

  const reviews = await prisma.review.findMany({
    where: { targetType: "GUIDE", targetId: guide.id },
    orderBy: { createdAt: "desc" },
    include: { traveler: true },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold">{guide.user.name}</h1>
        <p className="mt-1 text-stone-600">
          {guide.languages.join(", ")} · {guide.yearsExperience} yrs experience
        </p>
        <p className="mt-1 text-sm text-stone-500">
          Specialties: {guide.specialties.join(", ")}
        </p>
        <p className="mt-1 text-xs text-stone-400">
          TCB license: {guide.licenseNumber}
        </p>

        {guide.bio && <p className="mt-4 text-stone-700">{guide.bio}</p>}

        <p className="mt-4 text-lg font-semibold text-emerald-800">
          Nu. {Number(guide.ratePerDay).toLocaleString()} / day
        </p>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
          <ReviewList reviews={reviews} />
        </div>
      </div>

      <div>
        <GuideBookingForm guideId={guide.id} />
      </div>
    </div>
  );
}
