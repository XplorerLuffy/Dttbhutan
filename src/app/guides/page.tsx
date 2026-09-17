import { prisma } from "@/lib/prisma";
import ScrollReveal from "@/components/ScrollReveal";
import ListingRow from "@/components/listing/ListingRow";
import { FilterSidebar, FilterGroup } from "@/components/listing/FilterSidebar";
import Money from "@/components/Money";

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Licensed tour guides in Bhutan",
  description:
    "Browse licensed Bhutanese tour guides by language, speciality and region, with daily rates and real availability.",
  alternates: { canonical: "/guides" },
};

export const dynamic = "force-dynamic";

type SearchParams = {
  language?: string;
  specialty?: string;
  maxPrice?: string;
};

export default async function GuidesSearchPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { language, specialty, maxPrice } = await searchParams;

  const [guides, allApproved] = await Promise.all([
    prisma.guideProfile.findMany({
      where: {
        status: "APPROVED",
        ...(language ? { languages: { has: language } } : {}),
        ...(specialty ? { specialties: { has: specialty } } : {}),
        ...(maxPrice ? { ratePerDay: { lte: Number(maxPrice) } } : {}),
      },
      include: { user: true },
      orderBy: { ratePerDay: "asc" },
    }),
    prisma.guideProfile.findMany({
      where: { status: "APPROVED" },
      select: { languages: true, specialties: true },
    }),
  ]);

  const languages = uniqueSorted(allApproved.flatMap((g) => g.languages));
  const specialties = uniqueSorted(allApproved.flatMap((g) => g.specialties));

  const ratings = await prisma.review.groupBy({
    by: ["targetId"],
    where: { targetType: "GUIDE", targetId: { in: guides.map((g) => g.id) } },
    _avg: { rating: true },
    _count: { rating: true },
  });
  const ratingById = new Map(ratings.map((r) => [r.targetId, r]));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tour Guides</h1>

      <form method="get" className="flex flex-col gap-6 lg:flex-row">
        <FilterSidebar>
          <FilterGroup title="Language">
            <select name="language" defaultValue={language ?? ""} className="input">
              <option value="">Any language</option>
              {languages.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </FilterGroup>
          <FilterGroup title="Specialty">
            <select name="specialty" defaultValue={specialty ?? ""} className="input">
              <option value="">Any specialty</option>
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
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
            <span className="font-semibold text-stone-900">{guides.length}</span> guide
            {guides.length === 1 ? "" : "s"} found
          </p>

          {guides.length === 0 ? (
            <p className="text-stone-600">No guides match your filters yet.</p>
          ) : (
            <ScrollReveal className="flex flex-col gap-4">
              {guides.map((g) => {
                const rating = ratingById.get(g.id);
                return (
                  <ListingRow
                    key={g.id}
                    href={`/guides/${g.id}`}
                    imageUrl={g.photoUrl}
                    imageFallback={g.user.name[0]}
                    title={g.user.name}
                    subtitle={g.languages.join(", ")}
                    tags={g.specialties}
                    ratingAverage={rating?._avg.rating ?? null}
                    ratingCount={rating?._count.rating ?? 0}
                    priceLabel={<Money btn={Number(g.ratePerDay)} />}
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

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}
