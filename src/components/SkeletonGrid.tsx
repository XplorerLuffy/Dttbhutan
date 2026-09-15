export default function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div>
      <div className="card mb-6 h-24 animate-pulse bg-stone-100" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-4 w-2/3 rounded bg-stone-200" />
            <div className="mt-3 h-3 w-full rounded bg-stone-100" />
            <div className="mt-2 h-3 w-1/2 rounded bg-stone-100" />
            <div className="mt-4 h-4 w-1/3 rounded bg-stone-200" />
          </div>
        ))}
      </div>
    </div>
  );
}
