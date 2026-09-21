import { prisma } from "@/lib/prisma";
import CustomTourRequestForm from "./CustomTourRequestForm";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Build a custom Bhutan tour",
  description:
    "Design your own Bhutan trip — pick your guide, accommodation and vehicle and see the price per person update as you go.",
  alternates: { canonical: "/custom-tour" },
};

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

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 text-2xl font-bold">Build a Custom Tour</h1>
      <p className="mb-8 text-sm text-stone-600">
        Want something more tailored than our package tours? Pick your
        destinations, dates, and — if you already know what you want — your
        guide, hotel or homestay, and vehicle. We&apos;ll show you the price
        per person right away; our team still reviews every request before
        it&apos;s confirmed.
      </p>

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
