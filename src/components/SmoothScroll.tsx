"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Site-wide eased/momentum scrolling. Renders nothing — just drives the
 * scroll behavior via a rAF loop while mounted. Skips entirely under
 * prefers-reduced-motion, falling back to native scroll (Lenis's own easing
 * is a motion effect some users explicitly ask their OS to avoid).
 */
export default function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const lenis = new Lenis({
      duration: 1.1,
      smoothWheel: true,
    });

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  return null;
}
