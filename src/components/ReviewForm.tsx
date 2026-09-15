"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ReviewForm({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        bookingId,
        rating,
        comment: form.get("comment") || undefined,
      }),
    });

    setIsSubmitting(false);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Could not submit review");
      return;
    }

    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-3">
      <h3 className="font-semibold">Leave a review</h3>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={n <= rating ? "text-amber-500" : "text-stone-300"}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea name="comment" rows={3} placeholder="How was it?" className="input" />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={isSubmitting} className="btn-primary">
        {isSubmitting ? "Submitting..." : "Submit review"}
      </button>
    </form>
  );
}
