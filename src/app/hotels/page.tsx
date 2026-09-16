import { prisma } from "@/lib/prisma";
import ScrollReveal from "@/components/ScrollReveal";
import ListingRow from "@/components/listing/ListingRow";
import { FilterSidebar, FilterGroup } from "@/components/listing/FilterSidebar";
import Money from "@/components/Money";

export const dynamic = "force-dynamic";

type SearchParams = {
  destinationId?: string;
  amenity?: string;
  maxPrice?: string;
  adults?: string;
  children?: string;
};

export default async function HotelsSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { destinationId, amenity, maxPrice, adults, children } = await searchParams;

  const guests = (Number(adults) || 0) + (Number(children) || 0);
  const roomTypeFilter = {
    ...(maxPrice ? { pricePerNight: { lte: Number(maxPrice) } } : {}),
    ...(guests > 0 ? { capacity: { gte: guests } } : {}),
  };

  const [hotels, destinations, allApproved] = await Promise.all([
    prisma.hotel.findMany({
      where: {
        status: "APPROVED",
        ...(destinationId ? { destinationId } : {}),
        ...(amenity ? { amenities: { has: amenity } } : {}),
        ...(Object.keys(roomTypeFilter).length > 0 ? { roomTypes: { some: roomTypeFilter } } : {}),
      },
      include: {
        destination: true,
        roomTypes: { orderBy: { pricePerNight: "asc" }, take: 1 },
      },
    }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.hotel.findMany({
      where: { status: "APPROVED" },
      select: { amenities: true },
    }),
  ]);

  const amenities = uniqueSorted(allApproved.flatMap((h) => h.amenities));

  const ratings = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetType: "HOTEL", targetId: { in: hotels.map((h) => h.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingById = new Map(ratings.map((r) => [r.targetId, r]));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Hotels & Stays</h1>

      <form method="get" className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar>
          <FilterGroup title="Destination">
            <select name="destinationId" defaultValue={destinationId ?? ""} className="input">
              <option value="">Any destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup title="Amenity">
            <select name="amenity" defaultValue={amenity ?? ""} className="input">
              <option value="">Any amenity</option>
              {amenities.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup title="Max price / night">
            <input
              name="maxPrice"
              type="number"
              placeholder="Nu. per night"
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
            <span className="font-semibold text-stone-900">{hotels.length}</span> hotel
            {hotels.length === 1 ? "" : "s"} found
          </p>

          {hotels.length === 0 ? (
            <p className="text-stone-600">No hotels match your filters yet.</p>
          ) : (
            <ScrollReveal className="flex flex-col gap-4">
              {hotels.map((h) => {
                const rating = ratingById.get(h.id);
                return (
                  <ListingRow
                    key={h.id}
                    href={`/hotels/${h.id}`}
                    imageUrl={h.photoUrls[0]}
                    imageFallback={h.name[0]}
                    title={h.name}
                    subtitle={h.destination.name}
                    tags={h.amenities.slice(0, 4)}
                    ratingAverage={rating?._avg.rating ?? null}
                    ratingCount={rating?._count.rating ?? 0}
                    priceLabel={
                      h.roomTypes[0] ? <Money btn={Number(h.roomTypes[0].pricePerNight)} /> : "Contact for price"
                    }
                    priceSubLabel={h.roomTypes[0] ? "per night" : undefined}
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

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}
