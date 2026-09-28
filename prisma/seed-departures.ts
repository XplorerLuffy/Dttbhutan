import { PrismaClient, type DepartureStatus, type Itinerary } from "@prisma/client";

/**
 * Generates a plausible year of departure dates for every package.
 * Run with: npm run db:seed:departures
 *
 * This is demo data, not a schedule anyone has committed to — it exists so
 * the dates view has something to show while the agency's real calendar is
 * being put together. Replace it package by package from the admin's
 * "Departure dates" screen; nothing here is special-cased.
 *
 * Idempotent and conservative: a package that already has a future departure
 * is left alone, on the assumption that a real date beats a generated one.
 * Pass --replace to wipe and regenerate anyway, which also clears the dates
 * anyone has hand-entered.
 *
 * Deterministic: the pseudo-random choices are seeded from each package's
 * slug, so re-running produces the same calendar rather than reshuffling it
 * under a traveller who bookmarked a date.
 */

const prisma = new PrismaClient();

/** Hosts considered a local development database. */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);

/**
 * This script takes no connection argument — it writes wherever DATABASE_URL
 * points, which on a machine configured for deploys is production. It
 * creates rows travellers can see and (with --replace) deletes real ones, so
 * an unnoticed production DATABASE_URL matters.
 *
 * Run against a non-local database with:
 *   npm run db:seed:departures -- --allow-production
 */
function assertSafeTarget(): void {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — nothing to seed into.");

  let host: string;
  try {
    host = new URL(url).hostname;
  } catch {
    throw new Error("DATABASE_URL could not be parsed as a connection string; refusing to seed.");
  }

  if (LOCAL_HOSTS.has(host)) return;

  if (process.argv.includes("--allow-production")) {
    console.warn(`⚠️  --allow-production: seeding departures into NON-LOCAL database at ${host}\n`);
    return;
  }

  throw new Error(
    `Refusing to seed: DATABASE_URL points at "${host}", which is not a local database.\n` +
      "Re-run with --allow-production if that is really what you want."
  );
}

/**
 * Bhutan's travel year, as a weight per calendar month.
 *
 * Spring (Mar–May) and autumn (Sep–Nov) are the seasons people come for:
 * clear skies, the big tshechus, and passes that are open. The summer
 * monsoon closes the high trails and turns the roads east, and deep winter
 * shuts the high passes — so those months get few departures and treks get
 * none at all.
 */
const MONTH_WEIGHT = [1, 1, 3, 3, 2, 0, 0, 0, 3, 4, 2, 1]; // Jan … Dec
const MONSOON = new Set([5, 6, 7]); // Jun–Aug, zero-indexed

/** A small deterministic PRNG — same slug, same calendar, every run. */
function makeRandom(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return () => {
    h ^= h << 13;
    h ^= h >>> 17;
    h ^= h << 5;
    return ((h >>> 0) % 100000) / 100000;
  };
}

function utcDate(year: number, month: number, day: number) {
  return new Date(Date.UTC(year, month, day, 0, 0, 0));
}

type Plan = { startDate: Date; endDate: Date; status: DepartureStatus; note: string | null; priceOverride: number | null };

function planFor(itinerary: Itinerary): Plan[] {
  const random = makeRandom(itinerary.slug);
  const isTrek = itinerary.category === "TREKKING";
  const isFestival = /tshechu|festival/i.test(itinerary.slug);

  const today = new Date();
  const plans: Plan[] = [];

  // Fourteen months out, starting next month: far enough ahead to look like
  // a real season, near enough that the first date isn't a year away.
  for (let offset = 1; offset <= 14; offset++) {
    const cursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() + offset, 1));
    const year = cursor.getUTCFullYear();
    const month = cursor.getUTCMonth();

    if (isTrek && MONSOON.has(month)) continue;
    const weight = MONTH_WEIGHT[month];
    if (weight === 0) continue;

    // Longer trips run less often — a 20-day trek cannot leave weekly.
    const perMonth = Math.max(
      1,
      Math.min(weight, Math.ceil(weight / (itinerary.durationDays > 10 ? 3 : 1)))
    );

    for (let n = 0; n < perMonth; n++) {
      // Spread the departures across the month rather than clumping them.
      const day = 3 + Math.floor((n + random() * 0.8) * (24 / perMonth));
      const startDate = utcDate(year, month, Math.min(day, 27));
      const endDate = new Date(startDate);
      endDate.setUTCDate(endDate.getUTCDate() + itinerary.durationDays - 1);

      const roll = random();
      const status: DepartureStatus =
        roll > 0.93 ? "SOLD_OUT" : roll > 0.78 ? "LIMITED" : "OPEN";

      // A festival package's festival month costs more and says why — that
      // is the case the price range in the sub-nav exists to show.
      const peak = isFestival && (month === 2 || month === 3 || month === 8 || month === 9);

      plans.push({
        startDate,
        endDate,
        status,
        note: peak ? "Festival departure" : null,
        priceOverride: peak ? Math.round(Number(itinerary.pricePerPerson) * 1.25) : null,
      });
    }
  }

  return plans;
}

async function main() {
  assertSafeTarget();

  const replace = process.argv.includes("--replace");
  // Every itinerary, not just the published ones: a draft that gets
  // published later would otherwise be the one package on the site with no
  // dates, and drafts aren't public so there is nothing to protect.
  const itineraries = await prisma.itinerary.findMany({ orderBy: { slug: "asc" } });

  const startOfToday = new Date();
  startOfToday.setUTCHours(0, 0, 0, 0);

  let seeded = 0;
  let skipped = 0;

  for (const itinerary of itineraries) {
    const existing = await prisma.departure.count({
      where: { itineraryId: itinerary.id, startDate: { gte: startOfToday } },
    });

    if (existing > 0 && !replace) {
      skipped++;
      continue;
    }

    const plans = planFor(itinerary);
    await prisma.$transaction([
      prisma.departure.deleteMany({ where: { itineraryId: itinerary.id } }),
      prisma.departure.createMany({
        data: plans.map((p) => ({ ...p, itineraryId: itinerary.id })),
      }),
    ]);

    seeded++;
    console.log(`  ${itinerary.slug}: ${plans.length} departures`);
  }

  console.log(
    `\n${seeded} package${seeded === 1 ? "" : "s"} seeded, ${skipped} left alone (already had future dates).`
  );
  if (skipped > 0 && !replace) console.log("Pass --replace to regenerate those too.");
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
