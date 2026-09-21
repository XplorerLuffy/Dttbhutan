import { prisma } from "@/lib/prisma";
import ScrollReveal from "@/components/ScrollReveal";
import ListingRow from "@/components/listing/ListingRow";
import { FilterSidebar, FilterGroup } from "@/components/listing/FilterSidebar";
import type { ItineraryCategory, TripDifficulty } from "@prisma/client";
import Money from "@/components/Money";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Bhutan package tours",
  description:
    "Bhutan tour packages with day-by-day itineraries, licensed guides, hotels and transport included.",
  alternates: { canonical: "/packages" },
};

export const dynamic = "force-dynamic";

const DIFFICULTY_LABEL: Record<TripDifficulty, string> = {
  EASY: "Easy",
  MODERATE: "Moderate",
  CHALLENGING: "Challenging",
};

const CATEGORY_LABEL: Record<ItineraryCategory, string> = {
  TREKKING: "Trekking",
  CULTURAL: "Cultural",
  WILDLIFE: "Wildlife",
  HONEYMOON: "Honeymoon",
};

type SearchParams = {
  difficulty?: string;
  maxPrice?: string;
  destination?: string;
  duration?: string;
  category?: string;
};

const DURATION_BUCKETS: Record<string, { gte?: number; lte?: number }> = {
  "1-3": { gte: 1, lte: 3 },
  "4-6": { gte: 4, lte: 6 },
  "7-10": { gte: 7, lte: 10 },
  "11+": { gte: 11 },
};

export default async function PackagesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { difficulty, maxPrice, destination, duration, category } = await searchParams;
  const durationRange = duration ? DURATION_BUCKETS[duration] : undefined;

  const [itineraries, destinations] = await Promise.all([
    prisma.itinerary.findMany({
      where: {
        status: "PUBLISHED",
        ...(difficulty ? { difficulty: difficulty as TripDifficulty } : {}),
        ...(maxPrice ? { pricePerPerson: { lte: Number(maxPrice) } } : {}),
        ...(destination ? { days: { some: { destination: { slug: destination } } } } : {}),
        ...(durationRange ? { durationDays: durationRange } : {}),
        ...(category ? { category: category as ItineraryCategory } : {}),
      },
      orderBy: { pricePerPerson: "asc" },
      include: { days: { orderBy: { dayNumber: "asc" }, include: { destination: true } } },
    }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Package Tours</h1>
      <p className="mb-6 text-sm text-stone-600">
        Ready-made itineraries combining a guide, transport, and accommodation into one trip.
        Want something different?{" "}
        <a href="/custom-tour" className="text-brand-700 hover:underline">
          Request a custom tour
        </a>{" "}
        instead.
      </p>

      <form method="get" className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar>
          <FilterGroup title="Destination">
            <select name="destination" defaultValue={destination ?? ""} className="input">
              <option value="">All destinations</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup title="Duration">
            <select name="duration" defaultValue={duration ?? ""} className="input">
              <option value="">Any duration</option>
              <option value="1-3">1-3 days</option>
              <option value="4-6">4-6 days</option>
              <option value="7-10">7-10 days</option>
              <option value="11+">11+ days</option>
            </select>
          </FilterGroup>
          <FilterGroup title="Difficulty">
            <select name="difficulty" defaultValue={difficulty ?? ""} className="input">
              <option value="">Any difficulty</option>
              {Object.entries(DIFFICULTY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup title="Category">
            <select name="category" defaultValue={category ?? ""} className="input">
              <option value="">Any category</option>
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup title="Max price / person">
            <input
              name="maxPrice"
              type="number"
              placeholder="Nu. per person"
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
            <span className="font-semibold text-stone-900">{itineraries.length}</span> package
            {itineraries.length === 1 ? "" : "s"} found
          </p>

          {itineraries.length === 0 ? (
            <p className="text-stone-600">No packages match your filters yet.</p>
          ) : (
            <ScrollReveal className="flex flex-col gap-4">
              {itineraries.map((it) => {
                const destinationNames = uniqueOrdered(
                  it.days.map((d) => d.destination?.name).filter((n): n is string => Boolean(n))
                );
                return (
                  <ListingRow
                    key={it.id}
                    href={`/packages/${it.slug}`}
                    imageUrl={it.coverPhotoUrl}
                    imageFallback={it.title[0]}
                    badge={DIFFICULTY_LABEL[it.difficulty]}
                    title={it.title}
                    subtitle={it.summary}
                    tags={[`${it.durationDays} days`, ...destinationNames.slice(0, 3)]}
                    ratingAverage={null}
                    ratingCount={0}
                    priceLabel={<Money btn={Number(it.pricePerPerson)} />}
                    priceSubLabel="per person"
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

function uniqueOrdered(values: string[]) {
  return Array.from(new Set(values));
}
