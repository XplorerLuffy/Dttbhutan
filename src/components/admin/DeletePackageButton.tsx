"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DeletePackageButton({
  itineraryId,
  title,
  bookingCount,
}: {
  itineraryId: string;
  title: string;
  bookingCount: number;
}) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (bookingCount > 0) {
    return (
      <button
        type="button"
        disabled
        title={`Can't delete — ${bookingCount} booking${bookingCount === 1 ? "" : "s"} reference this package`}
        className="btn-secondary cursor-not-allowed opacity-50"
      >
        Delete
      </button>
    );
  }

  async function handleDelete() {
    if (!confirm(`Delete "${title}"? This can't be undone.`)) return;

    setIsDeleting(true);
    setError(null);

    const res = await fetch(`/api/admin/itineraries/${itineraryId}`, { method: "DELETE" });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete package");
      setIsDeleting(false);
      return;
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleDelete}
        disabled={isDeleting}
        className="btn-secondary text-red-700 hover:bg-red-50 disabled:opacity-50"
      >
        {isDeleting ? "Deleting..." : "Delete"}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
