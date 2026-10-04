import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import DepartureEditor, { type DepartureRow } from "@/components/admin/DepartureEditor";

export const metadata = { title: "Departure dates" };

export default async function AdminDeparturesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) return null; // the admin layout shows the sign-in form
  if (user.role !== "ADMIN") return null; // the admin layout shows the sign-in form

  const { id } = await params;
  const itinerary = await prisma.itinerary.findUnique({
    where: { id },
    include: { departures: { orderBy: { startDate: "asc" } } },
  });
  if (!itinerary) notFound();

  const initial: DepartureRow[] = itinerary.departures.map((d) => ({
    startDate: d.startDate.toISOString().slice(0, 10),
    endDate: d.endDate.toISOString().slice(0, 10),
    priceOverride: d.priceOverride === null ? "" : String(Number(d.priceOverride)),
    status: d.status,
    note: d.note ?? "",
  }));

  return (
    <div>
      <p className="mb-2 text-sm">
        <Link href="/chim/packages" className="text-brand-700 hover:underline">
          ← Package tours
        </Link>
      </p>
      <h1 className="mb-1 text-2xl font-bold">Departure dates</h1>
      <p className="mb-6 max-w-2xl text-sm text-stone-600">
        Scheduled departures for <strong>{itinerary.title}</strong> ({itinerary.durationDays} days).
        These appear on the public page, where travellers pick one and send a booking request. Past
        departures stop showing automatically.{" "}
        <Link href={`/packages/${itinerary.slug}#dates`} className="text-brand-700 hover:underline">
          View the public page
        </Link>
      </p>

      <DepartureEditor
        itineraryId={itinerary.id}
        durationDays={itinerary.durationDays}
        basePrice={Number(itinerary.pricePerPerson)}
        initial={initial}
      />
    </div>
  );
}
