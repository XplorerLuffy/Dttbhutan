import type { Prisma, PrismaClient } from "@prisma/client";
import type { z } from "zod";
import type { itineraryAdminSchema } from "@/lib/validation";

type ItineraryInput = z.infer<typeof itineraryAdminSchema>;
type DayInput = ItineraryInput["days"][number];
type LodgingInput = ItineraryInput["lodgings"][number];

/** Prisma client or an interactive transaction — both can do the writes below. */
type Db = PrismaClient | Prisma.TransactionClient;

function blankToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

/**
 * Writes an itinerary's lodgings and days.
 *
 * Days reference their lodging by *index* into the submitted lodging array
 * (see itineraryDayInputSchema): on edit the whole set is replaced, so the
 * ids the form would need don't exist until the lodgings have been created
 * here. Creating the lodgings first and mapping index → id afterwards keeps
 * the admin form free of id bookkeeping and makes an edit and a create the
 * same code path.
 *
 * Callers are responsible for deleting the existing rows first (on edit) and
 * for running the whole thing in one transaction.
 */
export async function writeItineraryDaysAndLodgings(
  db: Db,
  itineraryId: string,
  days: DayInput[],
  lodgings: LodgingInput[]
): Promise<void> {
  const lodgingIds: string[] = [];
  for (let position = 0; position < lodgings.length; position++) {
    const lodging = lodgings[position];
    const created = await db.itineraryLodging.create({
      data: {
        itineraryId,
        position,
        name: lodging.name.trim(),
        location: blankToNull(lodging.location),
        description: blankToNull(lodging.description),
        photoUrl: blankToNull(lodging.photoUrl),
      },
      select: { id: true },
    });
    lodgingIds.push(created.id);
  }

  for (const day of days) {
    await db.itineraryDay.create({
      data: {
        itineraryId,
        dayNumber: day.dayNumber,
        title: day.title,
        description: day.description,
        destinationId: day.destinationId || null,
        activities: day.activities,
        mealsIncluded: day.mealsIncluded,
        // An index pointing past the end of the list means the admin removed
        // that lodging after assigning it — drop the link rather than fail
        // the save over a stale select.
        lodgingId: day.lodgingIndex === undefined ? null : lodgingIds[day.lodgingIndex] ?? null,
        hikeDistanceKm: day.hikeDistanceKm ?? null,
        hikeAscentM: day.hikeAscentM ?? null,
        hikeDescentM: day.hikeDescentM ?? null,
        hikeHours: day.hikeHours ?? null,
        hikeDifficulty: day.hikeDifficulty || null,
        hikeNote: blankToNull(day.hikeNote),
      },
    });
  }
}
