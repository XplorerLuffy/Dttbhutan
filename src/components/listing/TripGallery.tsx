"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

export type GalleryPhoto = {
  id: string;
  url: string;
  caption: string | null;
};

/**
 * The trip's photo gallery: a grid that opens into a full-screen viewer.
 *
 * The first photo is given a wide cell so the grid reads as a composition
 * rather than a contact sheet, which is how an outfitter's gallery is laid
 * out — and it means a trip with three photos still looks deliberate.
 *
 * The viewer is a real modal: Escape closes it, the arrow keys move through
 * the set, focus moves into it on open and back to the thumbnail that
 * opened it on close, and the page behind it can't scroll. That is the
 * difference between a lightbox and a picture that happens to be on top.
 */
export default function TripGallery({
  photos,
  subject,
}: {
  photos: GalleryPhoto[];
  /** What the photos are of, e.g. "7-Day Essential Bhutan Journey". Used to
   * write alt text that says more than the caption alone — or when there is none. */
  subject?: string;
}) {
  const altFor = (photo: GalleryPhoto, i: number) => {
    if (!subject) return photo.caption ?? "";
    return photo.caption
      ? `${photo.caption}: ${subject}`
      : `${subject}: photo ${i + 1} of ${photos.length}`;
  };
  const [openAt, setOpenAt] = useState<number | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  const close = useCallback(() => setOpenAt(null), []);
  const step = useCallback(
    (delta: number) =>
      setOpenAt((current) =>
        current === null ? null : (current + delta + photos.length) % photos.length
      ),
    [photos.length]
  );

  useEffect(() => {
    if (openAt === null) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
      else if (event.key === "ArrowRight") step(1);
      else if (event.key === "ArrowLeft") step(-1);
    }

    // Lenis drives the page scroll from a rAF loop, so hiding overflow alone
    // wouldn't stop it — but the modal covers the viewport, and locking the
    // body is what keeps the scrollbar from jumping on open and close.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [openAt, close, step]);

  useEffect(() => {
    if (openAt === null) returnFocusTo.current?.focus();
  }, [openAt]);

  if (photos.length === 0) return null;

  const active = openAt === null ? null : photos[openAt];

  return (
    <>
      <ul className="grid auto-rows-[200px] grid-cols-2 gap-3 sm:auto-rows-[220px] lg:grid-cols-4">
        {photos.map((photo, i) => (
          <li
            key={photo.id}
            className={i === 0 ? "col-span-2 row-span-2 lg:col-span-2" : undefined}
          >
            <button
              type="button"
              onClick={(e) => {
                returnFocusTo.current = e.currentTarget;
                setOpenAt(i);
              }}
              className="group relative h-full w-full overflow-hidden rounded-xl bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-700 focus-visible:ring-offset-2"
            >
              <Image
                src={photo.url}
                alt={altFor(photo, i)}
                fill
                unoptimized
                sizes="(min-width: 1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
              />
              <span className="sr-only">
                Open photo {i + 1} of {photos.length}
                {photo.caption ? `: ${photo.caption}` : ""}
              </span>
            </button>
          </li>
        ))}
      </ul>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${(openAt ?? 0) + 1} of ${photos.length}`}
          className="fixed inset-0 z-50 flex flex-col bg-stone-950/95 p-4 sm:p-8"
          onClick={close}
        >
          <div className="flex justify-end">
            <button
              ref={closeRef}
              type="button"
              onClick={close}
              className="rounded-full p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            >
              <span className="sr-only">Close</span>
              <svg aria-hidden viewBox="0 0 24 24" className="h-7 w-7" {...STROKE}>
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </div>

          <div
            className="relative flex min-h-0 flex-1 items-center justify-center"
            // Clicks inside the frame shouldn't dismiss — only the backdrop.
            onClick={(e) => e.stopPropagation()}
          >
            {photos.length > 1 && (
              <Arrow direction="prev" onClick={() => step(-1)} />
            )}
            <div className="relative h-full w-full">
              <Image
                src={active.url}
                alt={altFor(active, openAt ?? 0)}
                fill
                unoptimized
                sizes="100vw"
                className="object-contain"
              />
            </div>
            {photos.length > 1 && <Arrow direction="next" onClick={() => step(1)} />}
          </div>

          <div
            className="mt-4 text-center text-sm text-white/70"
            onClick={(e) => e.stopPropagation()}
          >
            {active.caption && <p className="text-white/90">{active.caption}</p>}
            <p className="mt-1">
              {(openAt ?? 0) + 1} / {photos.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function Arrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const isPrev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute z-10 rounded-full bg-white/10 p-3 text-white transition-colors hover:bg-white/20 ${
        isPrev ? "left-0 sm:left-2" : "right-0 sm:right-2"
      }`}
    >
      <span className="sr-only">{isPrev ? "Previous photo" : "Next photo"}</span>
      <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" {...STROKE}>
        <path d={isPrev ? "M15 5 8 12l7 7" : "M9 5l7 7-7 7"} />
      </svg>
    </button>
  );
}
