type ReviewItem = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: Date;
  traveler: { name: string };
};

export default function ReviewList({ reviews }: { reviews: ReviewItem[] }) {
  if (reviews.length === 0) {
    return <p className="text-sm text-stone-500">No reviews yet.</p>;
  }

  return (
    <div className="space-y-3">
      {reviews.map((r) => (
        <div key={r.id} className="card">
          <div className="flex items-center justify-between">
            <span className="font-medium">{r.traveler.name}</span>
            <span className="text-amber-600">{"★".repeat(r.rating)}</span>
          </div>
          {r.comment && <p className="mt-1 text-sm text-stone-600">{r.comment}</p>}
        </div>
      ))}
    </div>
  );
}
