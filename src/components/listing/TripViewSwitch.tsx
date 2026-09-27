"use client";

import { useEffect, useState } from "react";
import TripSubNav, { type TripSubNavSection } from "./TripSubNav";
import { scrollToSection } from "@/lib/scroll-to-section";

/**
 * Owns which of a trip page's two views is showing: the trip itself
 * (overview, days, hotels, gallery, reviews) or its dates and prices.
 *
 * The dates are a view rather than another section on the page, the way an
 * outfitter's trip page treats them. Stacking them into the scroll puts a
 * table of departures between the reader and the trip they are still
 * deciding about; behind the button they are one click away and not in the
 * way until asked for.
 *
 * Both views come in already rendered from the server, so switching is
 * instant and there is no second request for content the page already has.
 * The trade is that the dates markup ships with every trip page — a table of
 * rows, which is cheap next to the photographs above it.
 */
export default function TripViewSwitch({
  sections,
  price,
  priceNote,
  datesPanel,
  children,
}: {
  sections: TripSubNavSection[];
  price: React.ReactNode;
  priceNote?: string;
  /** Rendered in place of `children` once the dates are asked for. */
  datesPanel: React.ReactNode;
  children: React.ReactNode;
}) {
  const [datesOpen, setDatesOpen] = useState(false);
  const [scrollTo, setScrollTo] = useState<string | null>(null);

  // Scrolling has to wait for the target to exist: coming back from the
  // dates, the section is mounted by this same render, so the jump happens
  // in the effect that follows it rather than in the click handler.
  // Two frames' grace before measuring. The section is mounted by the render
  // that cleared the dates, but the browser lays the new body out on the
  // next frame and settles the scroll position on the one after — measuring
  // any earlier reads the old view's geometry.
  useEffect(() => {
    if (!scrollTo) return;
    let inner = 0;
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => {
        scrollToSection(scrollTo);
        // Cleared here, not before: clearing it up front re-runs this effect,
        // and the cleanup then cancels the very frames it just scheduled.
        setScrollTo(null);
      });
    });
    return () => {
      cancelAnimationFrame(outer);
      if (inner) cancelAnimationFrame(inner);
    };
  }, [scrollTo]);

  function showDates() {
    setDatesOpen(true);
    // The dates view is short; landing mid-page would show it half-scrolled
    // past. Put its top under the sticky bar instead.
    requestAnimationFrame(() => requestAnimationFrame(() => scrollToSection("dates")));
  }

  return (
    <>
      <TripSubNav
        sections={sections}
        price={price}
        priceNote={priceNote}
        datesOpen={datesOpen}
        onViewDates={datesOpen ? () => setDatesOpen(false) : showDates}
        onSelectSection={(id) => {
          // Leaving the dates view has to happen first: the target section
          // is mounted by that same render, so the scroll waits for the
          // effect above rather than looking for an element that isn't there.
          if (datesOpen) {
            setDatesOpen(false);
            setScrollTo(id);
          } else {
            scrollToSection(id);
          }
        }}
      />

      {datesOpen ? datesPanel : children}
    </>
  );
}
