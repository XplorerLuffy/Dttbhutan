"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Staggers its direct children in on scroll (GSAP + ScrollTrigger), once,
 * the first time the container enters the viewport. Under
 * prefers-reduced-motion the movement is dropped and it cross-fades
 * instead — see the comment in the effect.
 */
export default function ScrollReveal({
  children,
  className,
  stagger = 0.08,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const targets = Array.from(el.children);
    if (targets.length === 0) return;

    // Reduced motion gets a plain cross-fade rather than nothing at all.
    // The setting exists to avoid movement that can cause vestibular
    // discomfort — parallax, sliding, zooming — and an opacity change is
    // none of those. Previously this branch disabled the reveal entirely,
    // which meant anyone with the OS setting on (it is on by default on a
    // fair number of Windows machines) saw a page where nothing ever
    // happened and reasonably concluded the animations were broken.
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: reduced ? 0 : 48 });

      // Each child gets its own trigger rather than one trigger on the
      // container. With a container trigger a long list — the 29-card
      // package grid, say — reveals everything the moment the grid's top
      // edge appears, so by the time you scroll to card 12 it finished
      // seconds ago. Per-item triggers mean every card animates as it
      // arrives, which is the whole point of a scroll reveal.
      targets.forEach((target, i) => {
        gsap.to(target, {
          opacity: 1,
          y: 0,
          // Short on purpose. A section crosses the viewport in a few tenths
          // of a second at normal scrolling speed, so a slower reveal simply
          // finishes off-screen and the visitor sees a page where nothing
          // ever animates. Measured: at 0.8s only a handful of frames landed
          // while the element was actually on screen.
          duration: reduced ? 0.4 : 0.55,
          ease: "power2.out",
          // Items on the same grid row enter together; a small offset by
          // position keeps that from looking like one block snapping in,
          // without needing to know the column count.
          delay: reduced ? 0 : (i % 3) * stagger,
          scrollTrigger: {
            trigger: target,
            // Fires as the item's top passes 88% of the viewport height —
            // just inside the lower edge, so the movement happens where it
            // can be seen rather than below the fold or already scrolled past.
            start: "top 88%",
            once: true,
          },
        });
      });
    }, containerRef);

    return () => ctx.revert();
  }, [stagger]);

  // Marks this subtree as already handled, so the site-wide AutoReveal
  // doesn't animate the same elements a second time.
  return (
    <div ref={containerRef} className={className} data-reveal-root="">
      {children}
    </div>
  );
}
