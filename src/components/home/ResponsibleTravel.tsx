import Link from "next/link";
import type { SiteContent } from "@/lib/content";

/**
 * Split panel on how Bhutan handles tourism.
 *
 * Everything stated here is about Bhutan's own policy — the High Value, Low
 * Volume approach and the Sustainable Development Fee — not a claim about
 * Droelma's own programmes, which would need the client's sign-off to put in
 * writing. The panel on the left stands in for photography the site doesn't
 * have yet; it carries a fact rather than a decorative gradient so the space
 * earns itself either way.
 */
export default function ResponsibleTravel({ content }: { content: SiteContent }) {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-pine-800 px-8 py-16 text-white sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(242,162,39,0.22),transparent_60%)]" />
        <div className="relative">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold-300">
            {content("home.responsible.eyebrow")}
          </p>
          <p className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            {content("home.responsible.stat")}
          </p>
          <p className="mt-6 text-sm leading-relaxed text-white/75">
            {content("home.responsible.caption")}
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
          {content("home.responsible.heading")}
        </h2>
        <p className="mt-6 text-base leading-relaxed text-stone-600">
          {content("home.responsible.body1")}
        </p>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          {content("home.responsible.body2")}
        </p>
        <Link
          href={content("home.responsible.ctaHref")}
          className="mt-8 inline-block rounded-full bg-brand-700 px-8 py-3.5 font-display text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
        >
          {content("home.responsible.cta")}
        </Link>
      </div>
    </div>
  );
}
