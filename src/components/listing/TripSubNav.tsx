"use client";

import { useEffect, useRef, useState } from "react";

export type TripSubNavSection = {
  /** Must match the id of a section element in the trip's default view. */
  id: string;
  label: string;
};

/**
 * Sticky nav for a trip page: tabs into the trip's own sections, the
 * from-price, and the button that swaps the body over to the dates.
 *
 * On a phone the price and that button move to a bar pinned to the bottom of
 * the screen, because there is no room for them beside the tabs — they were
 * simply hidden below `md`, which left phone visitors with no price and no way
 * to reach the dates except by scrolling to the foot of the page.
 *
 * Purely presentational — the parent owns which view is showing (see
 * TripViewSwitch), because the dates are a different view of the page
 * rather than another section to scroll to.
 *
 * Tabs are real anchors so they stay keyboard- and right-click-friendly and
 * work before this component hydrates. Once hydrated the parent takes every
 * click: it may need to leave the dates view first, and a single controlled
 * scroll is the only way both movers agree on where to stop.
 */
export default function TripSubNav({
  sections,
  price,
  priceNote,
  datesOpen = false,
  onViewDates,
  onSelectSection,
}: {
  sections: TripSubNavSection[];
  /**
   * "From <price>", or a range when departures are priced differently — the
   * caller formats it, because only it knows the viewer's currency.
   */
  price: React.ReactNode;
  /** Small print under the price, e.g. what the fare does and doesn't cover. */
  priceNote?: string;
  datesOpen?: boolean;
  onViewDates?: () => void;
  /** Called on a tab click. The parent owns the scroll — see scrollToSection. */
  onSelectSection?: (id: string) => void;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? "");
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Nothing to spy on while the dates are showing: those sections are
    // unmounted, so every lookup would miss and the first tab would light up.
    if (sections.length === 0 || datesOpen) return;

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
  }, [sections, datesOpen]);

  // On a phone the tab strip scrolls sideways, so the active tab can sit off
  // to the right where nobody sees it. Bring it into view as it changes.
  useEffect(() => {
    if (datesOpen) return;
    const strip = tabsRef.current;
    const tab = strip?.querySelector<HTMLElement>(`[data-tab="${active}"]`);
    if (!strip || !tab) return;
    const left = tab.offsetLeft - strip.offsetWidth / 2 + tab.offsetWidth / 2;
    strip.scrollTo({ left: Math.max(0, left), behavior: "smooth" });
  }, [active, datesOpen]);

  // The bar is fixed to the bottom of the viewport, where the chat launcher
  // also lives. Publishing its height lets that button lift by exactly this
  // much instead of the two guessing at each other's size — and because it is
  // cleared on unmount, pages without a bar are unaffected.
  const barRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = barRef.current;
    const root = document.documentElement;
    if (!el) return;

    const publish = () => {
      // getBoundingClientRect, not offsetHeight: the bar is display:none above
      // the md breakpoint, where it must publish 0 rather than its phone height.
      root.style.setProperty("--trip-bar-height", `${Math.round(el.getBoundingClientRect().height)}px`);
    };
    publish();

    const observer = new ResizeObserver(publish);
    observer.observe(el);
    window.addEventListener("resize", publish);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", publish);
      root.style.removeProperty("--trip-bar-height");
    };
  }, []);

  if (sections.length === 0) return null;

  return (
    <>
    <nav
      aria-label="Trip sections"
      /* Opaque, not translucent: content scrolling underneath shows through a
         /95 background as a smear of ghost text behind the tabs. */
      className="sticky top-0 z-30 -mx-4 mb-6 rounded-b-xl border-b border-stone-200 bg-white px-4 shadow-[0_2px_10px_-4px_rgba(10,49,89,0.25)] sm:-mx-6 sm:px-6"
    >
      <div className="flex items-center gap-4">
        <div ref={tabsRef} className="no-scrollbar -mb-px flex flex-1 gap-4 overflow-x-auto sm:gap-6">
          {sections.map((section) => {
            const isActive = !datesOpen && active === section.id;
            return (
              <a
                key={section.id}
                href={`#${section.id}`}
                data-tab={section.id}
                aria-current={isActive ? "true" : undefined}
                onClick={(event) => {
                  if (!onSelectSection) return;
                  // Both the default jump and Lenis's own anchor handling
                  // would otherwise move the page, and they disagree.
                  // stopPropagation is what keeps Lenis's window-level click
                  // listener out of it.
                  event.preventDefault();
                  event.stopPropagation();
                  onSelectSection(section.id);
                }}
                className={`shrink-0 whitespace-nowrap border-b-[3px] py-4 font-display text-[13px] font-bold transition-colors sm:text-sm ${
                  isActive
                    ? "border-brand-800 text-brand-900"
                    : "border-transparent text-stone-600 hover:text-stone-900"
                }`}
              >
                {section.label}
              </a>
            );
          })}
        </div>

        <div className="hidden shrink-0 items-center gap-4 py-2.5 md:flex">
          <div className="text-right leading-tight">
            <p className="font-display text-base font-bold text-brand-900">
              <span className="font-sans text-sm font-semibold text-stone-600">From </span>
              {price}
              <span className="font-sans text-sm font-medium text-stone-500">/person</span>
            </p>
            {priceNote && <p className="mt-0.5 text-xs text-stone-500">{priceNote}</p>}
          </div>
          {onViewDates && (
            <button
              type="button"
              onClick={onViewDates}
              aria-pressed={datesOpen}
              className={`rounded-full px-6 py-3 font-semibold transition-colors ${
                datesOpen
                  ? "border-2 border-brand-800 text-brand-900 hover:bg-brand-50"
                  : "bg-brand-800 text-white hover:bg-brand-900"
              }`}
            >
              {datesOpen ? "Back to trip" : "View Dates"}
            </button>
          )}
        </div>
      </div>
    </nav>

      {/* The phone counterpart of the price block above, which is md:flex. */}
      <div
        ref={barRef}
        className="fixed inset-x-0 bottom-0 z-40 border-t border-stone-200 bg-white px-4 py-3 shadow-[0_-2px_12px_-4px_rgba(10,49,89,0.3)] md:hidden"
        style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 leading-tight">
            <p className="font-display text-base font-bold text-brand-900">
              <span className="font-sans text-xs font-semibold text-stone-600">From </span>
              {price}
              <span className="font-sans text-xs font-medium text-stone-500">/person</span>
            </p>
            {priceNote && <p className="mt-0.5 line-clamp-2 text-[11px] text-stone-500">{priceNote}</p>}
          </div>
          {onViewDates && (
            <button
              type="button"
              onClick={onViewDates}
              aria-pressed={datesOpen}
              className={`shrink-0 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${
                datesOpen
                  ? "border-2 border-brand-800 text-brand-900"
                  : "bg-brand-800 text-white"
              }`}
            >
              {datesOpen ? "Back to trip" : "View Dates"}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
