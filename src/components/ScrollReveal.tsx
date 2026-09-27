"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Staggers its direct children in on scroll (GSAP + ScrollTrigger), once,
 * the first time the container enters the viewport. Falls back to a plain,
 * fully-visible render under prefers-reduced-motion.
 */
export default function ScrollReveal({
  children,
  className,
  stagger = 0.12,
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

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(targets, { opacity: 1, y: 0 });
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.set(targets, { opacity: 0, y: 40 });
      gsap.to(targets, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power2.out",
        stagger,
        scrollTrigger: {
          trigger: el,
          // Deliberately late. At "top 85%" a section is already animating
          // before it is properly on screen, and with momentum scrolling it
          // has finished by the time the visitor looks at it — which reads
          // as nothing having animated at all.
          start: "top 92%",
          once: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, [stagger]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
}
