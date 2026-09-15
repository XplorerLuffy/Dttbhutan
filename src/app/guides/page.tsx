import Image from "next/image";
import { prisma } from "@/lib/prisma";
import MotionCard from "@/components/MotionCard";
import ScrollReveal from "@/components/ScrollReveal";

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

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Tour Guides</h1>

      <form className="card mb-6 grid gap-3 sm:grid-cols-4" method="get">
        <select name="language" defaultValue={language ?? ""} className="input">
          <option value="">Any language</option>
          {languages.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
        <select name="specialty" defaultValue={specialty ?? ""} className="input">
          <option value="">Any specialty</option>
          {specialties.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
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

      {guides.length === 0 ? (
        <p className="text-stone-600">No guides match your filters yet.</p>
      ) : (
        <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {guides.map((g) => (
            <MotionCard key={g.id} href={`/guides/${g.id}`} className="card block">
              <div className="flex items-center gap-3">
                {g.photoUrl ? (
                  <Image
                    src={g.photoUrl}
                    alt={g.user.name}
                    width={48}
                    height={48}
                    unoptimized
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 font-display text-lg text-brand-700">
                    {g.user.name[0]}
                  </div>
                )}
                <h2 className="font-semibold">{g.user.name}</h2>
              </div>
              <p className="mt-3 text-sm text-stone-600">{g.languages.join(", ")}</p>
              <p className="mt-1 text-sm text-stone-500">{g.specialties.join(" · ")}</p>
              <p className="mt-2 font-medium text-brand-800">
                Nu. {Number(g.ratePerDay).toLocaleString()} / day
              </p>
            </MotionCard>
          ))}
        </ScrollReveal>
      )}
    </div>
  );
}

function uniqueSorted(values: string[]) {
  return Array.from(new Set(values)).sort();
}
