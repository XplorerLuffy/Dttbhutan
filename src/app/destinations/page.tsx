import Image from "next/image";
import MotionCard from "@/components/MotionCard";
import ScrollReveal from "@/components/ScrollReveal";
import { prisma } from "@/lib/prisma";
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
                <MotionCard
                  key={d.id}
                  href={`/destinations/${d.slug}`}
                  className="group relative block h-44 overflow-hidden rounded-lg shadow-sm"
                >
                  {d.photoUrl ? (
                    <Image
                      src={d.photoUrl}
                      alt={d.name}
                      fill
                      unoptimized
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-brand-600 to-brand-900" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-3">
                    <h3 className="font-display text-lg font-semibold text-white">{d.name}</h3>
                    <p className="text-xs text-white/85">
                      {d._count.hotels} hotel{d._count.hotels === 1 ? "" : "s"} ·{" "}
                      {d._count.guides} guide{d._count.guides === 1 ? "" : "s"}
                    </p>
                  </div>
                </MotionCard>
              ))}
            </ScrollReveal>
          </section>
        );
      })}
    </div>
  );
}
