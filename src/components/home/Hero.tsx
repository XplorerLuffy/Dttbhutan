"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SearchTabs from "./SearchTabs";

type Destination = { id: string; name: string; slug: string };

export default function Hero({ destinations }: { destinations: Destination[] }) {
  const heroRef = useRef<HTMLDivElement>(null);
  const backLayerRef = useRef<HTMLDivElement>(null);
  const frontLayerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.to(backLayerRef.current, {
        yPercent: 16,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(frontLayerRef.current, {
        yPercent: 30,
        ease: "none",
        scrollTrigger: { trigger: heroRef.current, start: "top top", end: "bottom top", scrub: true },
      });
    }, heroRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={heroRef}
      className="relative -mx-4 overflow-hidden rounded-b-[2.5rem] bg-gradient-to-br from-brand-900 via-brand-700 to-gold-600 px-4 pb-32 pt-16 text-white sm:-mx-6 sm:px-6 sm:pt-24"
    >
      <div ref={backLayerRef} className="pointer-events-none absolute inset-x-0 bottom-0 text-brand-900/40">
        <MountainRange />
      </div>
      <div ref={frontLayerRef} className="pointer-events-none absolute inset-x-0 bottom-0 text-brand-900/70">
        <MountainRange front />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-gold-200">
          The Last Shangri-La
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold sm:text-5xl">
          Plan your Bhutan trip end to end
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-brand-50/90">
          Licensed guides, hotels, GPS-tracked transport, and flights — booked
          in one place, with verified vendors and transparent trip mileage.
        </p>
      </div>

      <div className="relative mt-10 sm:mt-12">
        <SearchTabs destinations={destinations} />
      </div>
    </div>
  );
}

function MountainRange({ front = false }: { front?: boolean }) {
  const path = front
    ? "M0,120 L0,70 L120,40 L220,75 L320,20 L420,60 L540,15 L650,55 L760,25 L880,65 L1000,30 L1120,60 L1200,45 L1200,120 Z"
    : "M0,120 L0,90 L100,55 L200,85 L300,45 L400,80 L520,35 L640,75 L760,40 L880,80 L1000,50 L1120,85 L1200,60 L1200,120 Z";

  return (
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-32 w-full sm:h-44">
      <path d={path} fill="currentColor" />
    </svg>
  );
}
