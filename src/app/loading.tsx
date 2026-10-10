/**
 * Shown at once when any public page is opened, while its data arrives, so a
 * click always answers immediately. (The admin area has its own, in /chim.)
 */
export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6" aria-busy="true" aria-label="Loading">
      <div className="h-40 animate-pulse rounded-2xl bg-stone-200/70 sm:h-56" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-stone-200 bg-white">
            <div className="h-40 animate-pulse bg-stone-200/70" />
            <div className="space-y-2 p-4">
              <div className="h-4 w-3/4 animate-pulse rounded bg-stone-200/70" />
              <div className="h-3 w-1/2 animate-pulse rounded bg-stone-200/70" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
