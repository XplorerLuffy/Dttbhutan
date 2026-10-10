/**
 * Shown the instant an admin page is asked for, while the server fetches its
 * data. Without a loading boundary the old page stays put until the new one
 * is completely ready, which feels like the click didn't register.
 */
export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading">
      <div className="h-32 animate-pulse rounded-2xl bg-[#f3ead6]" />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-2xl border border-stone-200 bg-white" />
        ))}
      </div>
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 animate-pulse rounded-xl bg-stone-100" />
        ))}
      </div>
    </div>
  );
}
