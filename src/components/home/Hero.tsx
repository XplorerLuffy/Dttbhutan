"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import SearchTabs from "./SearchTabs";

type Destination = { id: string; name: string; slug: string };

const TRUST_PILLS = [
  { icon: "🛡️", label: "TCB-licensed guides" },
  { icon: "🗺️", label: "Ready-made & custom itineraries" },
  { icon: "✓", label: "Book directly with Droelma" },
];

/**
 * Video-background hero. The clip (public/uploads/herovideo.mp4) loops
 * silently behind the copy — autoplay/mute/playsInline together are what
 * let this actually autoplay on iOS Safari, not just Chrome. The gradient
 * layers beneath the <video> are a fallback background (shown briefly
 * before the video paints, and if video playback is ever blocked) rather
 * than decoration competing with the footage.
 */
export default function Hero({ destinations }: { destinations: Destination[] }) {
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
    <div>
      <div className="relative -mx-4 min-h-[560px] overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-900 px-4 pb-20 pt-14 text-white sm:-mx-6 sm:min-h-[640px] sm:px-6 sm:pb-24 sm:pt-20">
        <video
          ref={videoRef}
          src="/uploads/herovideo.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* Vignette so text stays legible over moving footage. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-black/40" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(242,162,39,0.2),transparent_55%)]" />

        <div ref={contentRef} className="relative mx-auto max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden>★</span> The Last Shangri-La
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
            Discover Bhutan, <em className="text-gold-300 italic">Your Way</em>
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Droelma Tours &amp; Travels helps you discover, plan, and book
            authentic Bhutan experiences — ready-made journeys, local
            guides, and custom trips, arranged directly with our team.
          </p>

          <div className="mt-6 flex flex-wrap gap-2">
            {TRUST_PILLS.map((t) => (
              <span
                key={t.label}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm sm:text-sm"
              >
                <span aria-hidden>{t.icon}</span>
                {t.label}
              </span>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="/custom-tour"
              className="inline-block rounded-full bg-gold-400 px-7 py-3 font-display text-base font-semibold text-brand-950 shadow-lg transition-transform hover:scale-[1.03] hover:bg-gold-300"
            >
              Plan Your Bhutan Trip →
            </a>
            <a
              href="/packages"
              className="inline-block rounded-full border border-white/40 bg-white/5 px-7 py-3 font-display text-base font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15"
            >
              Explore Tours
            </a>
          </div>
        </div>
      </div>

      {/* Floating search card — straddles the hero band and the page below it,
          the site's prominent trip-planning entry point. */}
      <div className="relative z-10 -mt-10 w-full px-1 sm:-mt-12">
        <SearchTabs destinations={destinations} />
      </div>
    </div>
  );
}
