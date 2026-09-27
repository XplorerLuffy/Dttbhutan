/**
 * Scrolls an in-page section to just under the sticky sub-nav.
 *
 * The position is measured from the layout tree (`offsetTop` up the
 * offsetParent chain) rather than from `getBoundingClientRect()`, because a
 * rect includes any transform currently applied to the element — and the
 * site-wide scroll reveals hold not-yet-revealed blocks a few dozen pixels
 * low. Measuring the rect meant a section that hadn't been revealed yet
 * reported a position it was about to leave, and the first jump to it landed
 * short of the bar by exactly that offset. Layout offsets ignore transforms,
 * so the answer is the same whether the reveal has run or not.
 *
 * The element's own `scroll-margin-top` is honoured either way, so this and
 * a plain anchor land in the same place.
 */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;

  let top = 0;
  let node: HTMLElement | null = el;
  while (node) {
    top += node.offsetTop;
    node = node.offsetParent as HTMLElement | null;
  }

  const margin = Number.parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
  const target = Math.max(0, Math.round(top - margin));

  const lenis = typeof window !== "undefined" ? window.__lenis : undefined;
  if (lenis) {
    // Lenis clamps to a page height it caches. Switching the trip page
    // between its two views changes that height by thousands of pixels, and
    // scrolling against the stale figure stops short — so make it re-measure
    // first. It is a cheap recalculation, and being right matters more.
    lenis.resize();
    lenis.scrollTo(target);
  } else {
    window.scrollTo({ top: target });
  }
}
