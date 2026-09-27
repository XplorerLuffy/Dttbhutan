"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide eased/momentum scrolling. Renders nothing — just drives the
 * scroll behavior via a rAF loop while mounted. Skips entirely under
 * prefers-reduced-motion, falling back to native scroll (Lenis's own easing
 * is a motion effect some users explicitly ask their OS to avoid).
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    gsap.registerPlugin(ScrollTrigger);

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
      // In-page anchors (the trip page's section nav) have to go through
      // Lenis: a native jump moves the scrollbar out from under its rAF loop
      // and the page snaps back. Lenis honours the target's scroll-margin-top
      // itself, so the `scroll-mt-24` on those sections clears the sticky
      // sub-nav on this path and on the native one — passing an offset here
      // as well would double it.
      anchors: true,
    });

    // Lenis drives scrolling from its own rAF loop, so ScrollTrigger has to
    // be told to recompute on each Lenis frame. Without this the two run on
    // separate clocks and reveals fire at the wrong scroll position.
    lenis.on("scroll", ScrollTrigger.update);

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Trigger positions are measured at mount, before fonts and images have
    // settled. On a page this long the resulting drift is enough to fire a
    // section's reveal while it is still off-screen, so the visitor scrolls
    // down to find it already finished.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);

    return () => {
      window.removeEventListener("load", refresh);
      lenis.off("scroll", ScrollTrigger.update);
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
