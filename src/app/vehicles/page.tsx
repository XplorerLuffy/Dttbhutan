import { prisma } from "@/lib/prisma";
import ScrollReveal from "@/components/ScrollReveal";
import ListingRow from "@/components/listing/ListingRow";
import { FilterSidebar, FilterGroup } from "@/components/listing/FilterSidebar";
import Money from "@/components/Money";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Transport & vehicle hire in Bhutan",
  description:
    "Hire vehicles with licensed drivers across Bhutan. GPS-verified trip mileage means your invoice matches the distance actually driven.",
  alternates: { canonical: "/vehicles" },
};

export const dynamic = "force-dynamic";

type SearchParams = {
  type?: string;
  minCapacity?: string;
  maxPrice?: string;
};

const VEHICLE_TYPES = ["SEDAN", "SUV", "VAN", "BUS"] as const;

export default async function VehiclesSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { type, minCapacity, maxPrice } = await searchParams;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      status: "APPROVED",
      ...(type ? { type: type as (typeof VEHICLE_TYPES)[number] } : {}),
      ...(minCapacity ? { capacity: { gte: Number(minCapacity) } } : {}),
      ...(maxPrice ? { ratePerDay: { lte: Number(maxPrice) } } : {}),
    },
    include: { operator: true, gpsDevice: true },
    orderBy: { ratePerDay: "asc" },
  });

  const ratings = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetType: "VEHICLE", targetId: { in: vehicles.map((v) => v.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingById = new Map(ratings.map((r) => [r.targetId, r]));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Transport</h1>

      <form method="get" className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar>
          <FilterGroup title="Vehicle type">
            <select name="type" defaultValue={type ?? ""} className="input">
              <option value="">Any type</option>
              {VEHICLE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup title="Min capacity">
            <input
              name="minCapacity"
              type="number"
              placeholder="Seats"
              defaultValue={minCapacity ?? ""}
              className="input"
            />
          </FilterGroup>
          <FilterGroup title="Max price / day">
            <input
              name="maxPrice"
              type="number"
              placeholder="Nu. per day"
              defaultValue={maxPrice ?? ""}
              className="input"
            />
          </FilterGroup>
          <button type="submit" className="btn-primary w-full">
            Show results
          </button>
        </FilterSidebar>

        <div className="min-w-0 flex-1">
          <p className="mb-4 text-sm text-stone-600">
            <span className="font-semibold text-stone-900">{vehicles.length}</span> vehicle
            {vehicles.length === 1 ? "" : "s"} found
          </p>

          {vehicles.length === 0 ? (
            <p className="text-stone-600">No vehicles match your filters yet.</p>
          ) : (
            <ScrollReveal className="flex flex-col gap-4">
              {vehicles.map((v) => {
                const rating = ratingById.get(v.id);
                return (
                  <ListingRow
                    key={v.id}
                    href={`/vehicles/${v.id}`}
                    imageFallback={v.type[0]}
                    badge={v.gpsDevice ? "GPS-tracked" : undefined}
                    title={`${v.type} · ${v.operator.businessName}`}
                    subtitle={`Driver: ${v.driverName}`}
                    tags={[`Capacity: ${v.capacity}`]}
                    ratingAverage={rating?._avg.rating ?? null}
                    ratingCount={rating?._count.rating ?? 0}
                    priceLabel={<Money btn={Number(v.ratePerDay)} />}
                    priceSubLabel="per day"
                  />
                );
              })}
            </ScrollReveal>
          )}
        </div>
      </form>
    </div>
  );
}
