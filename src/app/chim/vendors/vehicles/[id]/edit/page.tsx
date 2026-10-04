import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import VehicleEditForm from "@/components/admin/VehicleEditForm";
import ListingStatusSection from "@/components/admin/ListingStatusSection";

export default async function EditVehiclePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { operator: true },
  });
  if (!vehicle) notFound();

  return (
    <div>
      <Link href="/chim/vendors" className="text-sm text-stone-600 hover:underline">
        ← All vendors
      </Link>
      <h1 className="mb-1 mt-2 text-2xl font-bold">
        {vehicle.type} · {vehicle.plateNumber}
      </h1>
      <p className="mb-6 text-sm text-stone-600">
        Operated by {vehicle.operator.businessName}. Saving these details doesn&apos;t email the
        operator.
      </p>

      <VehicleEditForm
        vehicleId={vehicle.id}
        initial={{
          type: vehicle.type,
          capacity: vehicle.capacity,
          plateNumber: vehicle.plateNumber,
          driverName: vehicle.driverName,
          driverLicenseNumber: vehicle.driverLicenseNumber,
          ratePerDay: vehicle.ratePerDay.toString(),
          ratePerKm: vehicle.ratePerKm?.toString() ?? "",
        }}
      />

      <ListingStatusSection
        status={vehicle.status}
        apiPath={`/api/admin/vehicles/${vehicle.id}`}
        who="the operator"
      />
    </div>
  );
}
