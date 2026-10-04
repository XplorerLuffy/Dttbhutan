import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import GuideEditForm from "@/components/admin/GuideEditForm";
import ListingStatusSection from "@/components/admin/ListingStatusSection";

export default async function EditGuidePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const { id } = await params;
  const [guide, destinations] = await Promise.all([
    prisma.guideProfile.findUnique({
      where: { id },
      include: { user: true, destinations: { select: { id: true } } },
    }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!guide) notFound();

  return (
    <div>
      <Link href="/chim/vendors" className="text-sm text-stone-600 hover:underline">
        ← All vendors
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{guide.user.name}</h1>
      <p className="mb-6 text-sm text-stone-600">
        Guide listing as travelers see it on /guides and the homepage spotlight. Saving these
        details doesn&apos;t email the guide.
      </p>

      <GuideEditForm
        guideId={guide.id}
        destinations={destinations}
        initial={{
          licenseNumber: guide.licenseNumber,
          languages: guide.languages,
          specialties: guide.specialties,
          yearsExperience: guide.yearsExperience,
          // Decimal — toString avoids the float rounding a Number() would risk.
          ratePerDay: guide.ratePerDay.toString(),
          bio: guide.bio ?? "",
          photoUrl: guide.photoUrl ?? "",
          destinationIds: guide.destinations.map((d) => d.id),
        }}
      />

      <ListingStatusSection
        status={guide.status}
        apiPath={`/api/admin/guides/${guide.id}`}
        who="the guide"
      />
    </div>
  );
}
