import { vehicleMeta } from "@/lib/metaDescriptions";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VehicleBookingForm from "@/components/booking/VehicleBookingForm";
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

const VEHICLE_NAME: Record<string, string> = {
  SEDAN: "Sedan",
  SUV: "SUV",
  VAN: "Van",
  BUS: "Coaster bus",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    select: { status: true, type: true, capacity: true, metaDescription: true, operator: { select: { businessName: true } } },
  });
  if (!vehicle || vehicle.status !== "APPROVED") return { title: "Vehicle not found" };

  const name = VEHICLE_NAME[vehicle.type] ?? vehicle.type;
  const title = `${name} Hire with Driver in Bhutan`;
  const description = vehicleMeta({
    metaDescription: vehicle.metaDescription,
    typeName: name,
    capacity: vehicle.capacity,
    operator: vehicle.operator.businessName,
  });

  return {
    title,
    description,
    alternates: { canonical: `/vehicles/${id}` },
    openGraph: { title, description, url: `/vehicles/${id}`, images: [DEFAULT_OG_IMAGE] },
  };
}

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

  const [reviews, ratingAgg] = await Promise.all([
    prisma.review.findMany({
      where: { targetType: "VEHICLE", targetId: vehicle.id },
      orderBy: { createdAt: "desc" },
      include: { traveler: true },
    }),
    prisma.review.aggregate({
      where: { targetType: "VEHICLE", targetId: vehicle.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Transport", path: "/vehicles" },
          { name: `${VEHICLE_NAME[vehicle.type] ?? vehicle.type} · ${vehicle.operator.businessName}`, path: `/vehicles/${vehicle.id}` },
        ])}
      />
      <DetailGallery photos={[]} label={vehicle.type} />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold">
            {vehicle.type} · {vehicle.operator.businessName}
          </h1>
          <p className="mt-1 text-stone-600">Capacity: {vehicle.capacity}</p>
          <p className="text-sm text-stone-500">Driver: {vehicle.driverName}</p>

          <div className="mt-3">
            <RatingBadge average={ratingAgg._avg.rating} count={ratingAgg._count.rating} />
          </div>

          {vehicle.gpsDevice && (
            <p className="mt-4 text-sm text-brand-700">
              This vehicle is GPS-tracked — trip mileage is verified against the
              planned route, and you&apos;ll get a live tracking link once your
              trip starts.
            </p>
          )}

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
            <ReviewList reviews={reviews} />
          </div>
        </div>

        <div className="sticky-booking-card">
          <div className="price-summary-card">
            <p className="text-2xl font-bold text-brand-800">
              <Money btn={Number(vehicle.ratePerDay)} />
            </p>
            <p className="text-xs text-stone-500">
              per day
              {vehicle.ratePerKm && (
                <>
                  {" "}
                  + <Money btn={Number(vehicle.ratePerKm)} />
                  /km
                </>
              )}
            </p>
          </div>
          <VehicleBookingForm vehicleId={vehicle.id} />
        </div>
      </div>
    </div>
  );
}
