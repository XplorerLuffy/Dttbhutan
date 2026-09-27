import { format } from "date-fns";

export type TripReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  travelerName: string;
};

/**
 * Traveler reviews for one trip: the average and distribution on the left,
 * the reviews themselves on the right.
 *
 * Only reviews that carry a written comment reach this component — a bare
 * five-star click says nothing a visitor can use, and a column of empty
 * cards makes the real ones look padded. The average and the count still
 * come from every review, so the score isn't cherry-picked from the ones
 * people bothered to write about.
 */
export default function TripReviews({
  reviews,
  average,
  total,
}: {
  reviews: TripReview[];
  average: number;
  total: number;
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <div className="h-fit rounded-xl border border-stone-200 bg-white p-6 text-center">
        <p className="font-display text-5xl font-bold text-brand-800">{average.toFixed(1)}</p>
        <Stars rating={Math.round(average)} className="mt-2 justify-center" />
        <p className="mt-2 text-sm text-stone-600">
          from {total} traveler review{total === 1 ? "" : "s"}
        </p>
      </div>

      <ul className="space-y-4">
        {reviews.map((r) => (
          <li key={r.id} className="rounded-xl border border-stone-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-semibold text-stone-900">{r.travelerName}</p>
              <p className="text-xs text-stone-500">{format(r.createdAt, "MMMM yyyy")}</p>
            </div>
            <Stars rating={r.rating} className="mt-1" />
            {r.comment && <p className="mt-3 text-stone-700">{r.comment}</p>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stars({ rating, className = "" }: { rating: number; className?: string }) {
  return (
    <p className={`flex gap-0.5 ${className}`} aria-label={`${rating} out of 5`}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} aria-hidden className={i < rating ? "text-gold-500" : "text-stone-300"}>
          ★
        </span>
      ))}
    </p>
  );
}
