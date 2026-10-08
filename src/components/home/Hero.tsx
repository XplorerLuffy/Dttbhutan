"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import gsap from "gsap";
import HeroSearchBar from "./HeroSearchBar";

type Destination = { id: string; name: string; slug: string };

// Under /media, not /public/uploads: that directory is gitignored as
// dev-only user-upload scratch space, so anything left there never reaches
// a deployment. These two are site assets and ship with the code.

/**
 * Full-bleed video hero: the clip fills the section edge to edge, with a
 * single headline and the search bar centred over it.
 *
 * The clip loops silently — muted/loop/playsInline together are what let it
 * autoplay on iOS Safari, not just Chrome. It is attached after load rather
 * than fetched with the page (see the effect below), so the poster is what
 * the hero actually shows first; the gradient behind both is the last-resort
 * background if neither has painted.
 */
export default function Hero({
  destinations,
  headline,
  subtitle,
  searchButton,
  searchPrompt,
  customPrefix,
  customLink,
  customHref,
  customSuffix,
  videoUrl,
  posterUrl,
}: {
  destinations: Destination[];
  headline: string;
  subtitle: string;
  searchButton: string;
  searchPrompt: string;
  customPrefix: string;
  customLink: string;
  customHref: string;
  customSuffix: string;
  /** Both come from site content so the footage can be swapped without a code
   * change. The poster is what the visitor sees first and on any connection
   * that never gets the clip, so it should be a still from the same video. */
  videoUrl: string;
  posterUrl: string;
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

    // The clip is several megabytes. Letting the browser fetch it as part of
    // the initial page load put it in direct competition with everything
    // else on the connection — including the payload for whatever the
    // visitor clicked next, which is why navigation away from the homepage
    // felt so slow. So the <video> ships with no `src` at all: the poster
    // paints the hero immediately, and the clip is only attached once the
    // page has finished loading and the browser is otherwise idle.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Metered or slow connections keep the poster: a 6 MB autoplaying
    // background is not worth someone's data plan.
    const connection = (
      navigator as Navigator & {
        connection?: { saveData?: boolean; effectiveType?: string };
      }
    ).connection;
    if (connection?.saveData) return;
    if (connection?.effectiveType && /(^|-)2g$/.test(connection.effectiveType)) return;

    let cancelled = false;

    function start() {
      if (cancelled || !video || video.src || !videoUrl) return;
      // React doesn't reliably sync the `muted` JSX attribute to the DOM
      // property on every render path, and browsers gate autoplay on the
      // property, not the attribute — so force it directly, then kick off
      // playback ourselves rather than trusting the `autoPlay` attribute.
      video.muted = true;
      video.loop = true;
      video.src = videoUrl;
      video.load();
      video.play().catch(() => {
        // Autoplay can still be refused (e.g. data-saver mode) — the poster
        // underneath is a fine fallback either way.
      });
    }

    function schedule() {
      const idle = (window as Window & { requestIdleCallback?: typeof requestIdleCallback })
        .requestIdleCallback;
      if (idle) idle(() => start(), { timeout: 2500 });
      else window.setTimeout(start, 600);
    }

    if (document.readyState === "complete") schedule();
    else window.addEventListener("load", schedule, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", schedule);
    };
  }, [videoUrl]);

  return (
    <section className="relative isolate flex min-h-[600px] flex-col justify-center overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-900 sm:min-h-[720px]">
      {/* No `src` and no `autoPlay`: the effect above attaches the clip once
          the page is idle. `poster` is what the visitor actually sees first,
          so the hero looks finished immediately, and it stays put for anyone
          on reduced motion or a metered connection. */}
      <video
        ref={videoRef}
        poster={posterUrl}
        muted
        loop
        playsInline
        preload="none"
        aria-hidden="true"
        className="absolute inset-0 -z-10 h-full w-full object-cover"
      />

      {/* Kept light so the footage still reads as the subject. Legibility
          comes mostly from the headline's own shadow, not from dimming the
          whole clip the way a heavy scrim would. */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-black/45 via-black/20 to-black/45" />

      <div ref={contentRef} className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 sm:py-28">
        <h1 className="text-balance font-display text-4xl font-semibold leading-tight text-white [text-shadow:0_2px_18px_rgba(0,0,0,0.5)] sm:text-6xl">
          {headline}
        </h1>
        {subtitle && (
          <p className="mt-3 max-w-2xl text-lg text-white/95 [text-shadow:0_1px_12px_rgba(0,0,0,0.5)] sm:text-xl">
            {subtitle}
          </p>
        )}

        <div className="mt-10 sm:mt-12">
          <HeroSearchBar destinations={destinations} submitLabel={searchButton} prompt={searchPrompt} />
        </div>

        <p className="mt-6 text-center text-sm text-white [text-shadow:0_1px_10px_rgba(0,0,0,0.5)]">
          {customPrefix}{" "}
          <Link href={customHref} className="font-semibold underline underline-offset-4 hover:text-white">
            {customLink}
          </Link>{" "}
          {customSuffix}
        </p>
      </div>
    </section>
  );
}
