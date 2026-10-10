import { pageMetadata } from "@/lib/pageMeta";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSiteContent } from "@/lib/content";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata("gallery", "/gallery");
}

export const dynamic = "force-dynamic";

type GalleryPhoto = { href: string; photoUrl: string; caption: string; alt: string };

export default async function GalleryPage() {
  const content = await getSiteContent();
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
      select: { id: true, name: true, photoUrls: true, destination: { select: { name: true } } },
    }),
    prisma.guideProfile.findMany({
      where: { status: "APPROVED", photoUrl: { not: null } },
      select: { id: true, photoUrl: true, user: { select: { name: true } } },
    }),
  ]);

  // Alt text says what the picture is and where, in plain words — it is what
  // screen readers read aloud and what Google Images uses to understand a photo.
  const photos: GalleryPhoto[] = [
    ...destinations.map((d) => ({
      href: `/destinations/${d.slug}`,
      photoUrl: d.photoUrl as string,
      caption: d.name,
      alt: `${d.name}, Bhutan: landscape and landmarks of the ${d.name} district`,
    })),
    ...itineraries.map((it) => ({
      href: `/packages/${it.slug}`,
      photoUrl: it.coverPhotoUrl as string,
      caption: it.title,
      alt: `${it.title}: Bhutan tour package`,
    })),
    ...hotels.flatMap((h) =>
      h.photoUrls.map((url, i) => ({
        href: `/hotels/${h.id}`,
        photoUrl: url,
        caption: h.name,
        alt: `${h.name}, a hotel in ${h.destination.name}, Bhutan${h.photoUrls.length > 1 ? ` (photo ${i + 1} of ${h.photoUrls.length})` : ""}`,
      }))
    ),
    ...guides.map((g) => ({
      href: `/guides/${g.id}`,
      photoUrl: g.photoUrl as string,
      caption: g.user.name,
      alt: `${g.user.name}, licensed Bhutanese tour guide`,
    })),
  ];

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold">{content("gallery.heading")}</h1>
      <p className="mb-6 text-sm text-stone-600">{content("gallery.intro")}</p>

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
                alt={p.alt}
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
