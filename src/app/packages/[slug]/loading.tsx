/**
 * Shown while a trip page's data loads. Mirrors the real page's shape — a
 * full-bleed hero with the at-a-glance card overlapping it, then the sub-nav
 * — so the layout doesn't jump when the content arrives. The trip pages are
 * full-bleed (SiteChrome exempts /packages/*), so this lays out its own
 * width too.
 */
export default function Loading() {
  return (
    <div aria-hidden>
      <div className="h-[52vh] min-h-[380px] w-full animate-pulse bg-gradient-to-br from-brand-600 to-brand-950 sm:h-[60vh]" />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative -mt-8 grid gap-8 rounded-xl border border-stone-200 bg-white p-6 shadow-lg sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-2.5 w-20 rounded bg-stone-100" />
              <div className="mt-2 h-5 w-28 rounded bg-stone-200" />
            </div>
          ))}
        </div>

        <div className="mt-10 flex gap-6 rounded-b-xl border-b border-stone-200 bg-white px-4 py-5 sm:px-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-3 w-24 animate-pulse rounded bg-stone-100" />
          ))}
        </div>

        <div className="grid gap-10 pt-10 lg:grid-cols-[1fr_320px]">
          <div className="animate-pulse space-y-3">
            <div className="h-7 w-52 rounded bg-stone-200" />
            <div className="h-4 w-full rounded bg-stone-100" />
            <div className="h-4 w-11/12 rounded bg-stone-100" />
            <div className="h-4 w-3/4 rounded bg-stone-100" />
          </div>
          <div className="h-64 animate-pulse rounded-xl border border-stone-200 bg-white" />
        </div>
      </div>
    </div>
  );
}
