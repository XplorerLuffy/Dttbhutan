import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import HotelEditForm from "@/components/admin/HotelEditForm";

export default async function EditHotelPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { id } = await params;
  const [hotel, destinations] = await Promise.all([
    prisma.hotel.findUnique({ where: { id } }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!hotel) notFound();

  return (
    <div>
      <Link href="/admin/vendors" className="text-sm text-stone-600 hover:underline">
        ← All vendors
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">{hotel.name}</h1>
      <p className="mb-6 text-sm text-stone-600">
        Hotel listing as travelers see it on /hotels and the destination pages. Room types and
        prices are managed by the hotel from its own dashboard. Approval status is set from the
        vendors list — saving these details doesn&apos;t email the operator.
      </p>

      <HotelEditForm
        hotelId={hotel.id}
        destinations={destinations}
        initial={{
          name: hotel.name,
          description: hotel.description ?? "",
          destinationId: hotel.destinationId,
          address: hotel.address ?? "",
          latitude: hotel.latitude?.toString() ?? "",
          longitude: hotel.longitude?.toString() ?? "",
          amenities: hotel.amenities,
          photoUrls: hotel.photoUrls,
        }}
      />
    </div>
  );
}
