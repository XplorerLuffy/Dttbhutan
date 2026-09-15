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
}: {
  photos: (string | null | undefined)[];
  label: string;
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
        <Image src={main} alt={label} fill unoptimized className="object-cover" />
      </div>
      {thumbs.map((t, i) => (
        <div key={`${t}-${i}`} className="relative col-span-1 row-span-1">
          <Image src={t} alt={label} fill unoptimized className="object-cover" />
        </div>
      ))}
    </div>
  );
}
