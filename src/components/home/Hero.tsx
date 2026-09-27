"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import HeroSearchBar from "./HeroSearchBar";

type Destination = { id: string; name: string; slug: string };

/**
 * Full-bleed video hero: the clip fills the section edge to edge, with a
 * single headline and the search bar centred over it.
 *
 * The clip (public/uploads/herovideo.mp4) loops silently —
 * autoplay/mute/playsInline together are what let it actually autoplay on
 * iOS Safari, not just Chrome. The gradient beneath the <video> is a
 * fallback background (shown before the video paints, and if playback is
 * ever blocked) rather than decoration competing with the footage.
 */
export default function Hero({
  destinations,
  headline,
  searchButton,
  customPrefix,
  customLink,
  customSuffix,
}: {
  destinations: Destination[];
  headline: string;
  searchButton: string;
  customPrefix: string;
  customLink: string;
  customSuffix: string;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(contentRef.current, { opacity: 0, y: 18, duration: 0.8, ease: "power2.out" });
    }, contentRef);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    // React doesn't reliably sync the `muted` JSX attribute to the DOM
    // property on every render path, and browsers gate autoplay on the
    // property, not the attribute — so force it directly, then kick off
    // playback ourselves rather than trusting the `autoPlay` attribute.
    video.muted = true;
    video.loop = true;
    video.play().catch(() => {
      // Autoplay can still be refused (e.g. data-saver mode) — the
      // gradient background underneath is a fine fallback either way.
    });
  }, []);

  return (
    <section className="relative isolate flex min-h-[600px] flex-col justify-center overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-900 sm:min-h-[720px]">
      {/* `poster` paints a still immediately, so the hero looks finished
          while the clip downloads instead of showing bare gradient. The file
          is not in the repo yet — see docs/hero-video.md for how to produce
          it along with a web-sized encode of the clip itself. A missing
          poster is inert: the browser falls back to the gradient below. */}
      <video
        ref={videoRef}
        src="/uploads/herovideo.mp4"
        poster="/uploads/hero-poster.jpg"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      {/* Kept light so the footage still reads as the subject. Legibility
          comes mostly from the headline's own shadow, not from dimming the
          whole clip the way a heavy scrim would. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/20 to-black/45" />

      <div ref={contentRef} className="w-full px-4 py-24 sm:px-6 sm:py-28">
        <h1 className="text-balance text-center font-display text-4xl font-semibold leading-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.45)] sm:text-6xl">
          {headline}
        </h1>

        <div className="mt-10 sm:mt-12">
          <HeroSearchBar destinations={destinations} submitLabel={searchButton} />
        </div>

        <p className="mt-6 text-center text-sm text-white/90 [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
          {customPrefix}{" "}
          <Link href="/custom-tour" className="font-semibold underline underline-offset-4 hover:text-white">
            {customLink}
          </Link>{" "}
          {customSuffix}
        </p>
      </div>
    </section>
  );
}
