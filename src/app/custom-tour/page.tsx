import { prisma } from "@/lib/prisma";
import CustomTourRequestForm from "./CustomTourRequestForm";

export default async function CustomTourPage({
  searchParams,
}: {
  searchParams: Promise<{ destination?: string }>;
}) {
  const { destination } = await searchParams;
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, region: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-2xl font-bold">Request a Custom Tour</h1>
      <p className="mb-8 text-sm text-stone-600">
        Want something more tailored than our package tours? Tell us where
        you&apos;d like to go and how you like to travel, and our team will put
        together a bespoke itinerary and quote.
      </p>

      <CustomTourRequestForm destinations={destinations} preselectedDestinationId={destination} />
    </div>
  );
}
