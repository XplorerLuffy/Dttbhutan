import { prisma } from "@/lib/prisma";
import MotionCard from "@/components/MotionCard";
import ScrollReveal from "@/components/ScrollReveal";

export const dynamic = "force-dynamic";

const DIFFICULTY_LABEL: Record<string, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

export default async function PackagesPage() {
  const itineraries = await prisma.itinerary.findMany({
    where: { status: "PUBLISHED" },
    orderBy: { pricePerPerson: "asc" },
    include: { days: { orderBy: { dayNumber: "asc" }, include: { destination: true } } },
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Package Tours</h1>
      <p className="mb-8 text-sm text-stone-600">
        Ready-made itineraries combining a guide, transport, and
        accommodation into one trip. Want something different?{" "}
        <a href="/custom-tour" className="text-brand-700 hover:underline">
          Request a custom tour
        </a>{" "}
        instead.
      </p>

      {itineraries.length === 0 ? (
        <p className="text-stone-600">No packages published yet.</p>
      ) : (
        <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {itineraries.map((it) => {
            const destinationNames = uniqueOrdered(
              it.days.map((d) => d.destination?.name).filter((n): n is string => Boolean(n))
            );
            return (
              <MotionCard key={it.id} href={`/packages/${it.slug}`} className="card block">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{it.title}</h2>
                  <span className="badge bg-stone-100 text-stone-600">
                    {DIFFICULTY_LABEL[it.difficulty]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-stone-600">{it.summary}</p>
                {destinationNames.length > 0 && (
                  <p className="mt-2 text-xs text-stone-400">{destinationNames.join(" · ")}</p>
                )}
                <p className="mt-3 text-sm text-stone-500">{it.durationDays} days</p>
                <p className="mt-1 font-medium text-brand-800">
                  Nu. {Number(it.pricePerPerson).toLocaleString()} / person
                </p>
              </MotionCard>
            );
          })}
        </ScrollReveal>
      )}
    </div>
  );
}

function uniqueOrdered(values: string[]) {
  return Array.from(new Set(values));
}
