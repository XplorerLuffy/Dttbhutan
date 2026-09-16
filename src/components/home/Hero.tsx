"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import SearchTabs from "./SearchTabs";

type Destination = { id: string; name: string; slug: string };

const TRUST_PILLS = [
  { icon: "🛡️", label: "TCB-licensed guides" },
  { icon: "📍", label: "GPS-verified trip mileage" },
  { icon: "✈️", label: "Drukair & Bhutan Airlines" },
];

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
    <div>
      <div
        ref={heroRef}
        className="relative -mx-4 overflow-hidden bg-gradient-to-br from-brand-950 via-brand-800 to-brand-900 px-4 pb-20 pt-14 text-white sm:-mx-6 sm:px-6 sm:pb-24 sm:pt-20"
      >
        {/* Vignette so text pops the way it would over a photo */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(242,162,39,0.25),transparent_55%)]" />

        <div ref={backLayerRef} className="pointer-events-none absolute inset-x-0 bottom-0 text-brand-950/50">
          <MountainRange />
        </div>
        <div ref={frontLayerRef} className="pointer-events-none absolute inset-x-0 bottom-0 text-black/40">
          <MountainRange front />
        </div>

        <div className="relative mx-auto max-w-3xl">
          <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.2em] text-gold-300">
            <span aria-hidden>★</span> The Last Shangri-La
          </p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight sm:text-5xl">
            Plan your <em className="text-gold-300 italic">dream</em> Bhutan
            journey with Droelma
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/85 sm:text-lg">
            Licensed guides, hotels, GPS-tracked transport, and flights — booked
            in one place, with verified vendors and transparent trip mileage.
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

          <a
            href="/custom-tour"
            className="mt-8 inline-block rounded-full bg-gold-400 px-7 py-3 font-display text-base font-semibold text-brand-950 shadow-lg transition-transform hover:scale-[1.03] hover:bg-gold-300"
          >
            Plan My Bhutan Trip →
          </a>
        </div>
      </div>

      {/* Floating search card — straddles the hero band and the page below it,
          Booking.com's signature homepage element. */}
      <div className="relative z-10 mx-auto -mt-10 max-w-4xl px-1 sm:-mt-12">
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
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="h-40 w-full sm:h-56">
      <path d={path} fill="currentColor" />
    </svg>
  );
}
