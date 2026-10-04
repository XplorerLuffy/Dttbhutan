"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * Site-wide scroll reveals for pages that don't wire them up themselves.
 *
 * The alternative was wrapping sections by hand on every page, which would
 * have meant editing a dozen files and then remembering to do it again on
 * every page added later. This picks up structural blocks automatically, so
 * a new page gets the same treatment for free.
 *
 * Three rules keep it from doing damage:
 *
 * 1. It skips anything inside a <ScrollReveal>, which marks itself with
 *    data-reveal-root. Those pages already stagger their own children and
 *    animating them twice would fight.
 * 2. It only touches elements that are BELOW the fold when it runs. Hiding
 *    something already on screen would flash it out and back in, because
 *    the server-rendered HTML paints before this effect can run.
 * 3. It skips an element whose ancestor is already being revealed, so a
 *    card inside a revealed section animates once, with its parent, rather
 *    than twice at different times.
 * 4. It never translates an element that an in-page link points at. Lenis
 *    measures a jump target's position at click time; if the target is
 *    sitting 40px low waiting to be revealed, the scroll lands 40px short
 *    and the heading ends up under the sticky sub-nav. Those elements fade
 *    in without moving, which looks the same and stays where it is.
 */

/** Structural blocks worth revealing — not every element on the page. */
const SELECTOR = [
  "main section",
  "main article",
  "main figure",
  "main .card",
  "main .listing-row",
  "main h2",
  "main [data-reveal-item]",
].join(",");

/** App surfaces where reveals would be noise rather than polish. */
const SKIP_PREFIXES = ["/chim", "/dashboard", "/login", "/register", "/track"];

export default function AutoReveal() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return;

    gsap.registerPlugin(ScrollTrigger);
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Wait a frame so the page has laid out — element positions decide what
    // counts as below the fold, and they aren't final until after paint.
    let ctx: gsap.Context | undefined;
    const raf = requestAnimationFrame(() => {
      const fold = window.innerHeight;
      const candidates = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
        (el) =>
          !el.closest("[data-reveal-root]") &&
          el.getBoundingClientRect().top > fold * 0.95
      );

      const targets = candidates.filter(
        (el) => !candidates.some((other) => other !== el && other.contains(el))
      );
      if (targets.length === 0) return;

      const anchored = new Set(
        Array.from(document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]'))
          .map((a) => a.getAttribute("href")?.slice(1))
          .filter((id): id is string => Boolean(id))
      );

      ctx = gsap.context(() => {
        for (const el of targets) {
          const shift = reduced || (el.id && anchored.has(el.id)) ? 0 : 40;
          gsap.set(el, { opacity: 0, y: shift });
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: reduced ? 0.4 : 0.55,
            ease: "power2.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true },
          });
        }
      });
    });

    return () => {
      cancelAnimationFrame(raf);
      ctx?.revert();
    };
  }, [pathname]);

  return null;
}
