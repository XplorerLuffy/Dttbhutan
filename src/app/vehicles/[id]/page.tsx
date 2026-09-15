import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VehicleBookingForm from "@/components/booking/VehicleBookingForm";
import ReviewList from "@/components/ReviewList";

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: { operator: true, gpsDevice: true },
  });

  if (!vehicle || vehicle.status !== "APPROVED") notFound();

  const reviews = await prisma.review.findMany({
    where: { targetType: "VEHICLE", targetId: vehicle.id },
    orderBy: { createdAt: "desc" },
    include: { traveler: true },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold">
          {vehicle.type} · {vehicle.operator.businessName}
        </h1>
        <p className="mt-1 text-stone-600">Capacity: {vehicle.capacity}</p>
        <p className="text-sm text-stone-500">Driver: {vehicle.driverName}</p>
        {vehicle.gpsDevice && (
          <p className="mt-2 text-sm text-emerald-700">
            This vehicle is GPS-tracked — trip mileage is verified against the
            planned route, and you&apos;ll get a live tracking link once your
            trip starts.
          </p>
        )}

        <p className="mt-4 text-lg font-semibold text-emerald-800">
          Nu. {Number(vehicle.ratePerDay).toLocaleString()} / day
          {vehicle.ratePerKm && (
            <span className="ml-2 text-sm font-normal text-stone-500">
              + Nu. {Number(vehicle.ratePerKm).toLocaleString()}/km
            </span>
          )}
        </p>

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
          <ReviewList reviews={reviews} />
        </div>
      </div>

      <div>
        <VehicleBookingForm vehicleId={vehicle.id} />
      </div>
    </div>
  );
}
