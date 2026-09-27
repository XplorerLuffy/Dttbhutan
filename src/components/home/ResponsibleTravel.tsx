import Link from "next/link";

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
export default function ResponsibleTravel() {
  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-brand-900 via-brand-800 to-pine-800 px-8 py-16 text-white sm:px-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(242,162,39,0.22),transparent_60%)]" />
        <div className="relative">
          <p className="font-display text-sm font-semibold uppercase tracking-[0.18em] text-gold-300">
            Carbon negative
          </p>
          <p className="mt-5 font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Bhutan absorbs more carbon than it emits — the only country in the world that does.
          </p>
          <p className="mt-6 text-sm leading-relaxed text-white/75">
            Its constitution requires at least 60% of the country to stay under forest cover, in
            perpetuity.
          </p>
        </div>
      </div>

      <div>
        <h2 className="font-display text-3xl font-semibold leading-tight text-stone-900 sm:text-4xl">
          High Value, Low Volume
        </h2>
        <p className="mt-6 text-base leading-relaxed text-stone-600">
          Bhutan has never chased visitor numbers. Instead, every traveler pays a Sustainable
          Development Fee, which goes towards free healthcare and education for Bhutanese citizens,
          conservation work, and training for people working in tourism.
        </p>
        <p className="mt-4 text-base leading-relaxed text-stone-600">
          It is the reason the valleys you came to see still look the way they do — and the reason
          trips here are planned rather than improvised.
        </p>
        <Link
          href="/travel-guide/bhutans-sustainable-development-fee-explained"
          className="mt-8 inline-block rounded-full bg-brand-700 px-8 py-3.5 font-display text-base font-semibold text-white shadow-sm transition-colors hover:bg-brand-800"
        >
          How the fee works
        </Link>
      </div>
    </div>
  );
}
