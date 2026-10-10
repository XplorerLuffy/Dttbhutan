import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DestinationForm from "@/components/admin/DestinationForm";

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const { id } = await params;
  const destination = await prisma.destination.findUnique({ where: { id } });
  if (!destination) notFound();

  return (
    <div>
      <Link href="/chim/destinations" className="text-sm text-stone-600 hover:underline">
        ← All destinations
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">Edit {destination.name}</h1>
      <p className="mb-6 text-sm text-stone-600">
        These fields appear on the public destination page, the destinations listing and the homepage
        grid.
      </p>

      <DestinationForm
        initial={{
          id: destination.id,
          name: destination.name,
          slug: destination.slug,
          region: destination.region,
          description: destination.description ?? "",
          metaDescription: destination.metaDescription ?? "",
          highlights: destination.highlights,
          photoUrl: destination.photoUrl ?? "",
          photoUrls: destination.photoUrls,
          latitude: destination.latitude?.toString() ?? "",
          longitude: destination.longitude?.toString() ?? "",
        }}
      />
    </div>
  );
}
