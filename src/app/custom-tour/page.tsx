import { pageMetadata } from "@/lib/pageMeta";
import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";
import CustomTourRequestForm from "./CustomTourRequestForm";

import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("customTour", "/custom-tour");
}

export default async function CustomTourPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  const [destinations, guides, hotels, vehicles] = await Promise.all([
    prisma.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    prisma.guideProfile.findMany({
      where: { status: "APPROVED" },
      orderBy: { ratePerDay: "asc" },
      include: { user: { select: { name: true } }, destinations: { select: { id: true } } },
    }),
    prisma.hotel.findMany({
      where: { status: "APPROVED" },
      orderBy: { name: "asc" },
      include: { roomTypes: { orderBy: { pricePerNight: "asc" } } },
    }),
    prisma.vehicle.findMany({
      where: { status: "APPROVED" },
      orderBy: { ratePerDay: "asc" },
      include: { operator: { select: { businessName: true } } },
    }),
  ]);

  const content = await getSiteContent();

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">{content("customTour.heading")}</h1>
      {content("customTour.intro") && (
        <p className="mb-8 text-sm text-stone-600">{content("customTour.intro")}</p>
      )}

      <CustomTourRequestForm
        destinations={destinations}
        preselectedDestinationId={destination}
        guides={guides.map((g) => ({
          id: g.id,
          name: g.user.name,
          ratePerDay: Number(g.ratePerDay),
          languages: g.languages,
          specialties: g.specialties,
          destinationIds: g.destinations.map((d) => d.id),
        }))}
        hotels={hotels.map((h) => ({
          id: h.id,
          name: h.name,
          destinationId: h.destinationId,
          roomTypes: h.roomTypes.map((rt) => ({
            id: rt.id,
            name: rt.name,
            capacity: rt.capacity,
            pricePerNight: Number(rt.pricePerNight),
          })),
        }))}
        vehicles={vehicles.map((v) => ({
          id: v.id,
          type: v.type,
          capacity: v.capacity,
          ratePerDay: Number(v.ratePerDay),
          operatorName: v.operator.businessName,
        }))}
      />
    </div>
  );
}
