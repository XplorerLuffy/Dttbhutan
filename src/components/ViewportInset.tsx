"use client";

import { useEffect } from "react";

/**
 * Publishes how much of the bottom of the layout viewport is currently covered
 * by browser chrome, as `--viewport-bottom-inset` on <html>.
 *
 * Mobile Safari sizes the layout viewport to the *large* viewport — the page
 * is as tall as it would be with the toolbar collapsed — and then draws the
 * toolbar over the bottom of it when it expands. So `position: fixed;
 * bottom: 0` is not pinned to the bottom of what the visitor can see: it is
 * pinned to a line that the toolbar sits on top of. A trip page's booking bar
 * vanished behind it on every scroll-up and came back on every scroll-down,
 * which looked like a rendering fault and meant the price and the View Dates
 * button were simply gone for as long as the toolbar was open.
 *
 * There is no CSS for this. `env(safe-area-inset-bottom)` is the home-bar
 * cutout and does not move with the toolbar, and `dvh` units size an element
 * without saying where the visible area currently ends. The visual viewport is
 * the only thing that knows, so this measures the gap between the layout
 * viewport's bottom and the visible one's and hands it to CSS. Anything fixed
 * to the bottom can then sit on `bottom: var(--viewport-bottom-inset, 0px)`
 * and stay where it is wanted.
 *
 * Browsers without an overlaying toolbar — every desktop one, and Android
 * Chrome once its toolbar has settled — measure 0 and are unaffected.
 */

/**
 * The most we will lift anything, in px.
 *
 * The visual viewport also shrinks when the on-screen keyboard opens, by two
 * to three hundred pixels. That is not browser chrome and lifting a price bar
 * to the middle of the screen behind a keyboard would be worse than leaving
 * it; a toolbar is never anywhere near this tall, so the cap tells the two
 * apart without having to guess at which one is open.
 */
const MAX_INSET = 140;

export default function ViewportInset() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;
    if (!viewport) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      // clientHeight on the root element is the layout viewport's height by
      // definition, whatever the document's own height is — which matters
      // here, because Lenis sets html { height: auto }.
      const covered = root.clientHeight - (viewport.height + viewport.offsetTop);
      const inset = Math.min(MAX_INSET, Math.max(0, Math.round(covered)));
      root.style.setProperty("--viewport-bottom-inset", `${inset}px`);
    };

    // Safari animates the toolbar, so these fire many times in a row; one
    // measurement per frame is enough to follow it without reading layout
    // on every event.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    viewport.addEventListener("resize", schedule);
    viewport.addEventListener("scroll", schedule);
    window.addEventListener("orientationchange", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", schedule);
      viewport.removeEventListener("scroll", schedule);
      window.removeEventListener("orientationchange", schedule);
      root.style.removeProperty("--viewport-bottom-inset");
    };
  }, []);

  return null;
}
