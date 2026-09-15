const LABELS: [number, string][] = [
  [4.5, "Excellent"],
  [4, "Very good"],
  [3.5, "Good"],
  [3, "Pleasant"],
  [0, "Okay"],
];

function ratingLabel(average: number) {
  return LABELS.find(([min]) => average >= min)?.[1] ?? "Okay";
}

/**
 * A Booking.com-style rating badge: a solid score square plus a label and
 * review count. Renders a neutral "New" pill when there's no review data
 * yet, rather than a fabricated score.
 */
export default function RatingBadge({
  average,
  count,
}: {
  average: number | null;
  count: number;
}) {
  if (!average || count === 0) {
    return (
      <span className="rounded-md bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
        New listing
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-brand-700 text-sm font-bold text-white">
        {average.toFixed(1)}
      </span>
      <div className="text-xs leading-tight">
        <p className="font-semibold text-stone-800">{ratingLabel(average)}</p>
        <p className="text-stone-500">
          {count} review{count === 1 ? "" : "s"}
        </p>
      </div>
    </div>
  );
}
