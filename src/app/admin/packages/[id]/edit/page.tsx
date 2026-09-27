import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { dashboardPathForRole } from "@/lib/roles";
import ItineraryForm from "@/components/admin/ItineraryForm";

export default async function EditPackagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const { id } = await params;
  const [itinerary, destinations] = await Promise.all([
    prisma.itinerary.findUnique({
      where: { id },
      include: {
        days: { orderBy: { dayNumber: "asc" } },
        lodgings: { orderBy: { position: "asc" } },
        photos: { orderBy: { position: "asc" } },
      },
    }),
    prisma.destination.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  if (!itinerary) notFound();

  const lodgingIndexById = new Map(itinerary.lodgings.map((l, i) => [l.id, i]));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Edit package</h1>
      <ItineraryForm
        destinations={destinations}
        initial={{
          id: itinerary.id,
          title: itinerary.title,
          slug: itinerary.slug,
          summary: itinerary.summary,
          description: itinerary.description ?? "",
          durationDays: itinerary.durationDays,
          pricePerPerson: Number(itinerary.pricePerPerson),
          maxGroupSize: itinerary.maxGroupSize ?? "",
          difficulty: itinerary.difficulty,
          category: itinerary.category,
          status: itinerary.status,
          includes: itinerary.includes.join(", "),
          excludes: itinerary.excludes.join(", "),
          days: itinerary.days.map((d) => ({
            dayNumber: d.dayNumber,
            title: d.title,
            description: d.description ?? "",
            destinationId: d.destinationId ?? "",
            activities: d.activities.join(", "),
            mealsIncluded: d.mealsIncluded.join(", "),
            // The form addresses lodgings by position, not id — see
            // itineraryDayInputSchema.
            lodgingIndex: d.lodgingId ? lodgingIndexById.get(d.lodgingId) ?? "" : "",
            hikeDistanceKm: d.hikeDistanceKm === null ? "" : Number(d.hikeDistanceKm),
            hikeAscentM: d.hikeAscentM ?? "",
            hikeDescentM: d.hikeDescentM ?? "",
            hikeHours: d.hikeHours === null ? "" : Number(d.hikeHours),
            hikeDifficulty: d.hikeDifficulty ?? "",
            hikeNote: d.hikeNote ?? "",
          })),
          photos: itinerary.photos.map((p) => ({
            url: p.url,
            caption: p.caption ?? "",
          })),
          lodgings: itinerary.lodgings.map((l) => ({
            name: l.name,
            location: l.location ?? "",
            description: l.description ?? "",
            photoUrl: l.photoUrl ?? "",
          })),
        }}
      />
    </div>
  );
}
