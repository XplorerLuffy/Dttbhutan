import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type SearchParams = {
  location?: string;
  amenity?: string;
  maxPrice?: string;
};

export default async function HotelsSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { location, amenity, maxPrice } = await searchParams;

  const [hotels, allApproved] = await Promise.all([
    prisma.hotel.findMany({
      where: {
        status: "APPROVED",
        ...(location ? { location: { equals: location, mode: "insensitive" } } : {}),
        ...(amenity ? { amenities: { has: amenity } } : {}),
        ...(maxPrice
          ? { roomTypes: { some: { pricePerNight: { lte: Number(maxPrice) } } } }
          : {}),
      },
      include: {
        roomTypes: { orderBy: { pricePerNight: "asc" }, take: 1 },
      },
    }),
    prisma.hotel.findMany({
      where: { status: "APPROVED" },
      select: { location: true, amenities: true },
    }),
  ]);

  const locations = uniqueSorted(allApproved.map((h) => h.location));
  const amenities = uniqueSorted(allApproved.flatMap((h) => h.amenities));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Hotels & Stays</h1>

      <form className="card mb-6 grid gap-3 sm:grid-cols-4" method="get">
        <select name="location" defaultValue={location ?? ""} className="input">
          <option value="">Any location</option>
          {locations.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select name="amenity" defaultValue={amenity ?? ""} className="input">
          <option value="">Any amenity</option>
          {amenities.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <input
          name="maxPrice"
          type="number"
          placeholder="Max BTN/night"
          defaultValue={maxPrice ?? ""}
          className="input"
        />
        <button type="submit" className="btn-primary">
          Filter
        </button>
      </form>

      {hotels.length === 0 ? (
        <p className="text-stone-600">No hotels match your filters yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {hotels.map((h) => (
            <Link key={h.id} href={`/hotels/${h.id}`} className="card hover:shadow-md">
              <h2 className="font-semibold">{h.name}</h2>
              <p className="text-sm text-stone-600">{h.location}</p>
              <p className="mt-1 text-sm text-stone-500">{h.amenities.join(" · ")}</p>
              {h.roomTypes[0] && (
                <p className="mt-2 font-medium text-emerald-800">
                  From Nu. {Number(h.roomTypes[0].pricePerNight).toLocaleString()} / night
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}
