"use client";

import { useServerAction } from "@/components/useServerAction";

export default function RegenerateReportButton({ tripId }: { tripId: string }) {
  const { run, busy, error } = useServerAction();

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => void run(`/api/admin/gps/trips/${tripId}/regenerate`, { method: "POST" })}
        className="btn-secondary"
      >
        {busy ? "Recalculating..." : "Recalculate from GPS trail"}
      </button>
      {error && (
        <p role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
