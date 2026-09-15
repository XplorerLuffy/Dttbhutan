export default function Loading() {
  return (
    <div>
      <div className="card mb-6 h-24 animate-pulse bg-stone-100" />
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card h-24 animate-pulse" />
        ))}
      </div>
    </div>
  );
}
