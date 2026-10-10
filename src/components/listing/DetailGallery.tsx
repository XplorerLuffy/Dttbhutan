import Image from "next/image";

/**
 * Booking.com-style detail-page photo gallery: one large photo plus up to
 * four smaller thumbnails in a grid. Degrades gracefully to a single
 * full-width banner (or a brand-gradient placeholder) when there's only
 * one photo or none at all.
 */
export default function DetailGallery({
  photos,
  label,
  alt,
}: {
  photos: (string | null | undefined)[];
  label: string;
  /** What the photos show, e.g. "Hotel Druk, a hotel in Paro, Bhutan". Defaults to the label. */
  alt?: string;
}) {
  const valid = photos.filter((p): p is string => Boolean(p));

  if (valid.length === 0) {
    return (
      <div className="mb-6 flex h-64 items-center justify-center rounded-lg bg-gradient-to-br from-brand-600 to-brand-900 sm:h-80">
        <span className="font-display text-6xl text-white/30">{label[0]}</span>
      </div>
    );
  }

  const [main, ...rest] = valid;
  const thumbs = rest.slice(0, 4);

  return (
    <div className="mb-6 grid h-64 grid-cols-4 grid-rows-2 gap-1 overflow-hidden rounded-lg sm:h-80">
      <div className={`relative ${thumbs.length ? "col-span-2 row-span-2" : "col-span-4 row-span-2"}`}>
        <Image src={main} alt={alt ?? label} fill unoptimized className="object-cover" />
      </div>
      {thumbs.map((t, i) => (
        <div key={`${t}-${i}`} className="relative col-span-1 row-span-1">
          <Image src={t} alt={alt ? `${alt} (photo ${i + 2} of ${valid.length})` : label} fill unoptimized className="object-cover" />
        </div>
      ))}
    </div>
  );
}
