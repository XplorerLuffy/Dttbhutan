"use client";

import { useEffect, useRef, useState } from "react";

export type TripSubNavSection = {
  /** Must match the id of a section element on the page. */
  id: string;
  label: string;
};

/**
 * Sticky section nav for a trip page: jump links to the page's own sections,
 * the trip's from-price, and a shortcut to the departure dates.
 *
 * Sections are passed in rather than hard-coded so the bar only ever offers
 * tabs that exist — a package with no published departures has no dates
 * section, and a tab that scrolls nowhere is worse than no tab.
 *
 * The links are plain in-page anchors, which keeps them keyboard- and
 * right-click-friendly and means they still work before this component
 * hydrates. Lenis is configured with `anchors`, so it takes over the click
 * and eases the scroll; its offset matches the `scroll-mt-24` on the
 * sections, so both paths land in the same place.
 */
export default function TripSubNav({
  sections,
  price,
  datesId,
}: {
  sections: TripSubNavSection[];
  price: React.ReactNode;
  /** Section to point the call-to-action at; omitted when there are no dates. */
  datesId?: string;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (sections.length === 0) return;

    let frame = 0;
    const pick = () => {
      frame = 0;
      // The section under the bar wins, not the one merely intersecting:
      // with an IntersectionObserver a short section sandwiched between two
      // long ones never becomes "most visible" and its tab never lights up.
      let current = sections[0].id;
      for (const section of sections) {
        const el = document.getElementById(section.id);
        if (!el) continue;
        if (el.getBoundingClientRect().top <= 120) current = section.id;
      }
      // At the very bottom the last section may still start below the line,
      // so nothing would be marked — highlight it once the page bottoms out.
      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        current = sections[sections.length - 1].id;
      }
      setActive(current);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(pick);
    };

    pick();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [sections]);

  // On a phone the tab strip scrolls sideways, so the active tab can sit off
  // to the right where nobody sees it. Bring it into view as it changes.
  useEffect(() => {
    const strip = tabsRef.current;
    const tab = strip?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!strip || !tab) return;
    const left = tab.offsetLeft - strip.offsetWidth / 2 + tab.offsetWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active]);

  if (sections.length === 0) return null;

  return (
    <nav
      aria-label="Trip sections"
      /* Opaque, not translucent: content scrolling underneath shows through a
         /95 background as a smear of ghost text behind the tabs. */
      className="sticky top-0 z-30 -mx-4 mb-6 rounded-b-xl border-b border-stone-200 bg-white px-4 shadow-[0_2px_10px_-4px_rgba(10,49,89,0.25)] sm:-mx-6 sm:px-6"
    >
      <div className="flex items-center gap-4">
        <div ref={tabsRef} className="no-scrollbar -mb-px flex flex-1 gap-6 overflow-x-auto">
          {sections.map((section) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              data-tab={section.id}
              aria-current={active === section.id ? "true" : undefined}
              className={`shrink-0 whitespace-nowrap border-b-2 py-4 text-xs font-bold uppercase tracking-wider transition-colors ${
                active === section.id
                  ? "border-gold-500 text-brand-900"
                  : "border-transparent text-stone-500 hover:text-stone-900"
              }`}
            >
              {section.label}
            </a>
          ))}
        </div>

        <div className="hidden shrink-0 items-center gap-4 py-2.5 md:flex">
          <p className="text-right text-sm leading-tight text-stone-500">
            <span className="block text-[11px] font-semibold uppercase tracking-wide">From</span>
            <span className="font-display text-base font-bold text-brand-800">{price}</span>
          </p>
          {datesId && (
            <a
              href={`#${datesId}`}
              className="rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
            >
              View dates
            </a>
          )}
        </div>
      </div>
    </nav>
  );
}
