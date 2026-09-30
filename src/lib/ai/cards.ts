import "server-only";
import { prisma } from "@/lib/prisma";
import type { ToolObservation } from "@/lib/ai/assistant";

/**
 * Turns "which packages did this answer look up" into cards the assistant page
 * can render — a photo, the price, the day list, a link.
 *
 * The alternative was having the model emit the card as JSON, which puts the
 * price in the model's hands. It would sooner or later round one, and a wrong
 * price on a booking page is the one mistake this system must not make. So the
 * model only ever decides *which* package is relevant; every figure on the card
 * is read back out of Postgres here.
 */

export type PackageCardDay = { dayNumber: number; title: string; destination: string | null };

export type PackageCard = {
  slug: string;
  title: string;
  summary: string;
  coverPhotoUrl: string | null;
  durationDays: number;
  pricePerPersonBTN: number;
  difficulty: string;
  category: string;
  days: PackageCardDay[];
};

/** Tools whose results name a package. */
const PACKAGE_TOOLS = new Set(["search_packages", "get_package_details"]);

/** More than a few cards stops being an answer and becomes a search-results
 * page, which is what /packages is for. */
const MAX_CARDS = 3;

function slugsFrom(result: unknown): string[] {
  if (!result || typeof result !== "object") return [];
  const record = result as Record<string, unknown>;

  // get_package_details returns one package; search_packages returns a list.
  const candidates: unknown[] = Array.isArray(record.packages)
    ? record.packages
    : record.package
      ? [record.package]
      : [record];

  return candidates
    .map((c) => (c && typeof c === "object" ? (c as Record<string, unknown>).slug : null))
    .filter((s): s is string => typeof s === "string" && s.length > 0);
}

/**
 * `reply` is used to narrow, not to parse. A broad search can return fifteen
 * packages while the answer discusses two; showing all fifteen would bury the
 * reply. So a package is carded only when the answer actually names it —
 * except when exactly one was looked up, which is already unambiguous.
 */
export async function collectPackageCards(
  observations: ToolObservation[],
  reply: string
): Promise<PackageCard[]> {
  const slugs = new Set<string>();
  for (const observation of observations) {
    if (!PACKAGE_TOOLS.has(observation.name)) continue;
    for (const slug of slugsFrom(observation.result)) slugs.add(slug);
  }
  if (slugs.size === 0) return [];

  const packages = await prisma.itinerary.findMany({
    where: { slug: { in: Array.from(slugs) }, status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      summary: true,
      coverPhotoUrl: true,
      durationDays: true,
      pricePerPerson: true,
      difficulty: true,
      category: true,
      days: {
        orderBy: { dayNumber: "asc" },
        select: { dayNumber: true, title: true, destination: { select: { name: true } } },
      },
    },
  });

  const haystack = reply.toLowerCase();
  const named = packages.filter((p) => haystack.includes(p.title.toLowerCase()));
  const chosen = named.length > 0 ? named : packages.length === 1 ? packages : [];

  return chosen.slice(0, MAX_CARDS).map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.summary,
    coverPhotoUrl: p.coverPhotoUrl,
    durationDays: p.durationDays,
    // Decimal → number at the edge, once, so the client never handles Prisma's
    // Decimal and never re-derives a price of its own.
    pricePerPersonBTN: Number(p.pricePerPerson),
    difficulty: p.difficulty,
    category: p.category,
    days: p.days.map((d) => ({
      dayNumber: d.dayNumber,
      title: d.title,
      destination: d.destination?.name ?? null,
    })),
  }));
}
