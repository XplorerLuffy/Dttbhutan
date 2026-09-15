import { prisma } from "@/lib/prisma";
import MotionCard from "@/components/MotionCard";
import ScrollReveal from "@/components/ScrollReveal";
import type { DzongkhagRegion } from "@prisma/client";

export const dynamic = "force-dynamic";

const REGION_LABEL: Record<DzongkhagRegion, string> = {
  WEST: "Western Bhutan",
  CENTRAL: "Central Bhutan",
  EAST: "Eastern Bhutan",
};

export default async function DestinationsPage() {
  const destinations = await prisma.destination.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { hotels: true, guides: true } } },
  });

  const byRegion = new Map<DzongkhagRegion, typeof destinations>();
  for (const d of destinations) {
    byRegion.set(d.region, [...(byRegion.get(d.region) ?? []), d]);
  }

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Destinations</h1>
      <p className="mb-8 text-sm text-stone-600">
        All 20 dzongkhags (districts) of Bhutan — from the well-trodden west
        to the far east, visited by only a handful of travelers each year.
      </p>

      {(["WEST", "CENTRAL", "EAST"] as const).map((region) => {
        const items = byRegion.get(region) ?? [];
        if (items.length === 0) return null;
        return (
          <section key={region} className="mb-10">
            <h2 className="mb-4 font-display text-xl font-semibold text-brand-800">
              {REGION_LABEL[region]}
            </h2>
            <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {items.map((d) => (
                <MotionCard key={d.id} href={`/destinations/${d.slug}`} className="card block">
                  <h3 className="font-semibold">{d.name}</h3>
                  <p className="mt-1 line-clamp-2 text-sm text-stone-600">{d.description}</p>
                  <p className="mt-2 text-xs text-stone-400">
                    {d._count.hotels} hotel{d._count.hotels === 1 ? "" : "s"} ·{" "}
                    {d._count.guides} guide{d._count.guides === 1 ? "" : "s"}
                  </p>
                </MotionCard>
              ))}
            </ScrollReveal>
          </section>
        );
      })}
    </div>
  );
}
