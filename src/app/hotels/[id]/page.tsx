import { hotelMeta } from "@/lib/metaDescriptions";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import HotelBookingForm from "@/components/booking/HotelBookingForm";
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: {
      status: true,
      name: true,
      description: true,
      metaDescription: true,
      amenities: true,
      photoUrls: true,
      destination: { select: { name: true } },
    },
  });
  if (!hotel || hotel.status !== "APPROVED") return { title: "Hotel not found" };

  const title = `${hotel.name}, ${hotel.destination.name}, Bhutan`;
  const description = hotelMeta({
    name: hotel.name,
    metaDescription: hotel.metaDescription,
    destination: hotel.destination.name,
    amenities: hotel.amenities,
  });

  return {
    title,
    description,
    alternates: { canonical: `/hotels/${id}` },
    openGraph: {
      title,
      description,
      url: `/hotels/${id}`,
      images: [hotel.photoUrls[0] ?? DEFAULT_OG_IMAGE],
    },
  };
}

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

  const [reviews, ratingAgg] = await Promise.all([
    prisma.review.findMany({
      where: { targetType: "HOTEL", targetId: hotel.id },
      orderBy: { createdAt: "desc" },
      include: { traveler: true },
    }),
    prisma.review.aggregate({
      where: { targetType: "HOTEL", targetId: hotel.id },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  return (
    <div>
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Hotels", path: "/hotels" },
          { name: hotel.name, path: `/hotels/${hotel.id}` },
        ])}
      />
      <DetailGallery
        photos={hotel.photoUrls}
        label={hotel.name}
        alt={`${hotel.name}, a hotel in ${hotel.destination.name}, Bhutan`}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="text-2xl font-bold">{hotel.name}</h1>
          <p className="mt-1 text-stone-600">
            <Link
              href={`/destinations/${hotel.destination.slug}`}
              className="hover:text-brand-700 hover:underline"
            >
              {hotel.destination.name}
            </Link>
          </p>
          {hotel.address && <p className="text-sm text-stone-500">{hotel.address}</p>}

          <div className="mt-3">
            <RatingBadge average={ratingAgg._avg.rating} count={ratingAgg._count.rating} />
          </div>

          {hotel.amenities.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {hotel.amenities.map((a) => (
                <span key={a} className="rounded bg-stone-100 px-2 py-0.5 text-xs text-stone-600">
                  {a}
                </span>
              ))}
            </div>
          )}

          {hotel.description && <p className="mt-4 text-stone-700">{hotel.description}</p>}

          <div className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
            <ReviewList reviews={reviews} />
          </div>
        </div>

        <div className="sticky-booking-card">
          {hotel.roomTypes.map((rt) => (
            <div key={rt.id} className="space-y-3">
              <div className="price-summary-card">
                <h3 className="font-semibold">{rt.name}</h3>
                <p className="text-sm text-stone-500">Sleeps {rt.capacity}</p>
                <p className="mt-1 text-2xl font-bold text-brand-800">
                  <Money btn={Number(rt.pricePerNight)} />
                </p>
                <p className="text-xs text-stone-500">per night</p>
              </div>
              <HotelBookingForm roomTypeId={rt.id} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
