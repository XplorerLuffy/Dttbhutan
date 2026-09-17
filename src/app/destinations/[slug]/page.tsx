import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import MotionCard from "@/components/MotionCard";
import ScrollReveal from "@/components/ScrollReveal";
import Money from "@/components/Money";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await prisma.destination.findUnique({ where: { slug } });
  if (!destination) return { title: "Destination not found" };

  const description =
    destination.description?.slice(0, 155) ??
    `Plan a trip to ${destination.name}, Bhutan — hotels, licensed guides and package tours.`;

  return {
    title: `${destination.name}, Bhutan`,
    description,
    alternates: { canonical: `/destinations/${destination.slug}` },
    openGraph: {
      title: `${destination.name}, Bhutan`,
      description,
      url: `/destinations/${destination.slug}`,
    },
  };
}

export default async function DestinationDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const destination = await prisma.destination.findUnique({ where: { slug } });
  if (!destination) notFound();

  const [hotels, guides, itineraries] = await Promise.all([
    prisma.hotel.findMany({
      where: { destinationId: destination.id, status: "APPROVED" },
      include: { roomTypes: { orderBy: { pricePerNight: "asc" }, take: 1 } },
    }),
    prisma.guideProfile.findMany({
      where: { status: "APPROVED", destinations: { some: { id: destination.id } } },
      include: { user: true },
    }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED", days: { some: { destinationId: destination.id } } },
    }),
  ]);

  return (
    <div>
      <p className="text-sm font-medium uppercase tracking-wide text-gold-700">
        {destination.region === "WEST"
          ? "Western Bhutan"
          : destination.region === "CENTRAL"
            ? "Central Bhutan"
            : "Eastern Bhutan"}
      </p>
      <h1 className="mt-1 text-3xl font-bold">{destination.name}</h1>
      {destination.description && <p className="mt-3 max-w-2xl text-stone-700">{destination.description}</p>}

      {destination.highlights.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {destination.highlights.map((h) => (
            <li key={h} className="badge bg-gold-100 text-gold-800">
              {h}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-6">
        <Link href={`/custom-tour?destination=${destination.id}`} className="btn-primary inline-block">
          Request a custom tour to {destination.name}
        </Link>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Hotels in {destination.name}</h2>
        {hotels.length === 0 ? (
          <p className="text-sm text-stone-500">No hotels listed here yet.</p>
        ) : (
          <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {hotels.map((h) => (
              <MotionCard key={h.id} href={`/hotels/${h.id}`} className="card block">
                <h3 className="font-semibold">{h.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{h.amenities.join(" · ")}</p>
                {h.roomTypes[0] && (
                  <p className="mt-2 font-medium text-brand-800">
                    From <Money btn={Number(h.roomTypes[0].pricePerNight)} /> / night
                  </p>
                )}
              </MotionCard>
            ))}
          </ScrollReveal>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Guides covering {destination.name}</h2>
        {guides.length === 0 ? (
          <p className="text-sm text-stone-500">No guides list this destination yet.</p>
        ) : (
          <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guides.map((g) => (
              <MotionCard key={g.id} href={`/guides/${g.id}`} className="card block">
                <h3 className="font-semibold">{g.user.name}</h3>
                <p className="mt-1 text-sm text-stone-500">{g.specialties.join(" · ")}</p>
                <p className="mt-2 font-medium text-brand-800">
                  <Money btn={Number(g.ratePerDay)} /> / day
                </p>
              </MotionCard>
            ))}
          </ScrollReveal>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-lg font-semibold">Packages visiting {destination.name}</h2>
        {itineraries.length === 0 ? (
          <p className="text-sm text-stone-500">No package tours include this destination yet.</p>
        ) : (
          <ScrollReveal className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {itineraries.map((it) => (
              <MotionCard key={it.id} href={`/packages/${it.slug}`} className="card block">
                <h3 className="font-semibold">{it.title}</h3>
                <p className="mt-1 text-sm text-stone-500">{it.durationDays} days</p>
                <p className="mt-2 font-medium text-brand-800">
                  <Money btn={Number(it.pricePerPerson)} /> / person
                </p>
              </MotionCard>
            ))}
          </ScrollReveal>
        )}
      </section>
    </div>
  );
}
