import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HotelBookingForm from "@/components/booking/HotelBookingForm";
import ReviewList from "@/components/ReviewList";

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    include: { roomTypes: true, destination: true },
  });

  if (!hotel || hotel.status !== "APPROVED") notFound();

  const reviews = await prisma.review.findMany({
    where: { targetType: "HOTEL", targetId: hotel.id },
    orderBy: { createdAt: "desc" },
    include: { traveler: true },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <h1 className="text-2xl font-bold">{hotel.name}</h1>
        <p className="mt-1 text-stone-600">
          <Link href={`/destinations/${hotel.destination.slug}`} className="hover:text-brand-700 hover:underline">
            {hotel.destination.name}
          </Link>
        </p>
        {hotel.address && <p className="text-sm text-stone-500">{hotel.address}</p>}
        <p className="mt-1 text-sm text-stone-500">{hotel.amenities.join(" · ")}</p>

        {hotel.description && <p className="mt-4 text-stone-700">{hotel.description}</p>}

        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
          <ReviewList reviews={reviews} />
        </div>
      </div>

      <div className="space-y-4">
        {hotel.roomTypes.map((rt) => (
          <div key={rt.id}>
            <div className="card mb-2">
              <h3 className="font-semibold">{rt.name}</h3>
              <p className="text-sm text-stone-500">Sleeps {rt.capacity}</p>
              <p className="mt-1 font-medium text-brand-800">
                Nu. {Number(rt.pricePerNight).toLocaleString()} / night
              </p>
            </div>
            <HotelBookingForm roomTypeId={rt.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
