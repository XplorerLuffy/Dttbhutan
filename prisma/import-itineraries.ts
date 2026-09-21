import { PrismaClient } from "@prisma/client";
import { IMPORTED_ITINERARIES } from "./data/importedItineraries";

const prisma = new PrismaClient();

async function main() {
  const destinations = await prisma.destination.findMany({ select: { id: true, name: true } });
  const destinationIdByName = new Map(destinations.map((d) => [d.name, d.id]));

  for (const itinerary of IMPORTED_ITINERARIES) {
    await prisma.itinerary.deleteMany({ where: { slug: itinerary.slug } });
    await prisma.itinerary.create({
      data: {
        title: itinerary.title,
        slug: itinerary.slug,
        category: itinerary.category,
        difficulty: itinerary.difficulty,
        summary: itinerary.summary,
        description: itinerary.description,
        durationDays: itinerary.durationDays,
        pricePerPerson: itinerary.pricePerPerson,
        maxGroupSize: itinerary.maxGroupSize,
        status: "PUBLISHED",
        coverPhotoUrl: null,
        includes: itinerary.includes,
        excludes: itinerary.excludes,
        days: {
          create: itinerary.days.map((day) => {
            const destinationId = day.destinationName ? destinationIdByName.get(day.destinationName) : undefined;
            if (day.destinationName && !destinationId) {
              throw new Error(`Unknown destination "${day.destinationName}" on day ${day.dayNumber} of "${itinerary.title}"`);
            }
            return {
              dayNumber: day.dayNumber,
              title: day.title,
              description: day.description,
              destinationId,
              activities: day.activities,
              mealsIncluded: day.mealsIncluded,
            };
          }),
        },
      },
    });
    console.log(`Imported: ${itinerary.title} (${itinerary.slug})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (err) => {
    console.error(err);
    await prisma.$disconnect();
    process.exit(1);
  });
