import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import DestinationForm from "@/components/admin/DestinationForm";

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { id } = await params;
  const destination = await prisma.destination.findUnique({ where: { id } });
  if (!destination) notFound();

  return (
    <div>
      <Link href="/admin/destinations" className="text-sm text-stone-600 hover:underline">
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
          highlights: destination.highlights,
          photoUrl: destination.photoUrl ?? "",
          latitude: destination.latitude?.toString() ?? "",
          longitude: destination.longitude?.toString() ?? "",
        }}
      />
    </div>
  );
}
