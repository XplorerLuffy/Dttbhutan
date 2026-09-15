"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

type TripStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export default function TripControls({
  tripId,
  status,
  hasGpsDevice,
}: {
  tripId: string;
  status: TripStatus;
  hasGpsDevice: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function call(path: string, method = "POST") {
    setError(null);
    startTransition(async () => {
      const res = await fetch(path, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Action failed");
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "NOT_STARTED" && (
        <button
          type="button"
          disabled={isPending}
          onClick={() => call(`/api/trips/${tripId}/start`)}
          className="btn-primary"
        >
          Start trip
        </button>
      )}
      {status === "IN_PROGRESS" && (
        <>
          {hasGpsDevice && (
            <button
              type="button"
              disabled={isPending}
              onClick={() => call(`/api/dev/simulate-ping/${tripId}`)}
              className="btn-secondary"
              title="Demo only: simulates a GPS ping from this vehicle's device"
            >
              Simulate GPS ping (demo)
            </button>
          )}
          <button
            type="button"
            disabled={isPending}
            onClick={() => call(`/api/trips/${tripId}/end`)}
            className="btn-primary"
          >
            End trip
          </button>
        </>
      )}
      {status === "COMPLETED" && (
        <span className="text-sm text-stone-500">Trip completed</span>
      )}
      {error && <span className="text-sm text-red-600">{error}</span>}
    </div>
  );
}
