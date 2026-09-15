import { prisma } from "@/lib/prisma";
import MotionCard from "@/components/MotionCard";
import ScrollReveal from "@/components/ScrollReveal";

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

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Transport</h1>

      <form className="card mb-6 grid gap-3 sm:grid-cols-4" method="get">
        <select name="type" defaultValue={type ?? ""} className="input">
          <option value="">Any type</option>
          {VEHICLE_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <input
          name="minCapacity"
          type="number"
          placeholder="Min capacity"
          defaultValue={minCapacity ?? ""}
          className="input"
        />
        <input
          name="maxPrice"
          type="number"
          placeholder="Max BTN/day"
          defaultValue={maxPrice ?? ""}
          className="input"
        />
        <button type="submit" className="btn-primary">
          Filter
        </button>
      </form>

      {vehicles.length === 0 ? (
        <p className="text-stone-600">No vehicles match your filters yet.</p>
      ) : (
        <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((v) => (
            <MotionCard key={v.id} href={`/vehicles/${v.id}`} className="card block">
              <h2 className="font-semibold">
                {v.type} · {v.operator.businessName}
              </h2>
              <p className="text-sm text-stone-600">Capacity: {v.capacity}</p>
              <p className="text-sm text-stone-500">Driver: {v.driverName}</p>
              {v.gpsDevice && (
                <p className="mt-1 text-xs text-brand-700">GPS-tracked</p>
              )}
              <p className="mt-2 font-medium text-brand-800">
                Nu. {Number(v.ratePerDay).toLocaleString()} / day
              </p>
            </MotionCard>
          ))}
        </ScrollReveal>
      )}
    </div>
  );
}
