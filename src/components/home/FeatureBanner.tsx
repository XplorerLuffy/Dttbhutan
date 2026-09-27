"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

/**
 * Full-bleed closing banner over the hero footage.
 *
 * It reuses the hero's clip because it's the only real media the site has;
 * the browser serves it from cache, so this costs a decode rather than a
 * second download. Playback is tied to visibility — a second video decoding
 * continuously while the visitor reads the sections above it is wasted
 * battery on a page this long, and `preload="none"` keeps it off the
 * critical path entirely.
 */
export default function FeatureBanner() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = true;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.25 }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-brand-950">
      <video
        ref={videoRef}
        src="/uploads/herovideo.mp4"
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-t from-brand-950/85 via-brand-950/55 to-brand-950/65" />

      <div className="mx-auto max-w-3xl px-4 py-28 text-center text-white sm:px-6 sm:py-36">
        <h2 className="text-balance font-display text-3xl font-semibold leading-tight sm:text-5xl">
          No Two Trips Should Look Alike
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-white/85 sm:text-lg">
          Tell us how long you have, what you want to see, and how hard you want to walk. We&apos;ll
          build the rest around it.
        </p>
        <Link
          href="/custom-tour"
          className="mt-10 inline-block rounded-full bg-white px-9 py-3.5 font-display text-base font-semibold text-brand-900 shadow-lg transition-transform hover:scale-[1.03]"
        >
          Plan My Trip
        </Link>
      </div>
    </section>
  );
}
