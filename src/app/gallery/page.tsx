import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Photo gallery",
  description: "A look at Bhutan's destinations, tour packages, hotels, and guides on Droelma Tours & Travels.",
  alternates: { canonical: "/gallery" },
};

export const dynamic = "force-dynamic";

type GalleryPhoto = { href: string; photoUrl: string; caption: string };

export default async function GalleryPage() {
  const [destinations, itineraries, hotels, guides] = await Promise.all([
    prisma.destination.findMany({
      where: { photoUrl: { not: null } },
      select: { slug: true, name: true, photoUrl: true },
    }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED", coverPhotoUrl: { not: null } },
      select: { slug: true, title: true, coverPhotoUrl: true },
    }),
    prisma.hotel.findMany({
      where: { status: "APPROVED" },
      select: { id: true, name: true, photoUrls: true },
    }),
    prisma.guideProfile.findMany({
      where: { status: "APPROVED", photoUrl: { not: null } },
      select: { id: true, photoUrl: true, user: { select: { name: true } } },
    }),
  ]);

  const photos: GalleryPhoto[] = [
    ...destinations.map((d) => ({ href: `/destinations/${d.slug}`, photoUrl: d.photoUrl as string, caption: d.name })),
    ...itineraries.map((it) => ({
      href: `/packages/${it.slug}`,
      photoUrl: it.coverPhotoUrl as string,
      caption: it.title,
    })),
    ...hotels.flatMap((h) =>
      h.photoUrls.map((url) => ({ href: `/hotels/${h.id}`, photoUrl: url, caption: h.name }))
    ),
    ...guides.map((g) => ({
      href: `/guides/${g.id}`,
      photoUrl: g.photoUrl as string,
      caption: g.user.name,
    })),
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">Gallery</h1>
      <p className="mb-6 text-sm text-stone-600">
        Destinations, tour packages, stays, and guides from across Droelma Tours &amp; Travels.
      </p>

      {photos.length === 0 ? (
        <p className="text-stone-600">
          No photos uploaded yet — check back soon, or browse{" "}
          <Link href="/destinations" className="text-brand-700 hover:underline">
            destinations
          </Link>{" "}
          and{" "}
          <Link href="/packages" className="text-brand-700 hover:underline">
            packages
          </Link>{" "}
          directly.
        </p>
      ) : (
        <div className="columns-2 gap-3 sm:columns-3 lg:columns-4">
          {photos.map((p, i) => (
            <Link
              key={`${p.href}-${i}`}
              href={p.href}
              className="group relative mb-3 block overflow-hidden rounded-lg break-inside-avoid"
            >
              <Image
                src={p.photoUrl}
                alt={p.caption}
                width={400}
                height={300}
                unoptimized
                className="w-full object-cover transition-transform group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 py-2 text-sm font-medium text-white">
                {p.caption}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
