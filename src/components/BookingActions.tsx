"use client";

import { useServerAction } from "@/components/useServerAction";

function ActionError({ error }: { error: string | null }) {
  return error ? (
    <p role="alert" className="mt-1 max-w-xs text-sm text-red-600">
      {error}
    </p>
  ) : null;
}

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const { run, busy, error } = useServerAction();

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() => {
          if (!confirm("Cancel this booking?")) return;
          void run(`/api/bookings/${bookingId}`, {
            method: "PATCH",
            body: JSON.stringify({ status: "CANCELLED" }),
          });
        }}
        className="btn-secondary"
      >
        {busy ? "Cancelling..." : "Cancel booking"}
      </button>
      <ActionError error={error} />
    </div>
  );
}

export function SetBookingStatusButton({
  bookingId,
  status,
  label,
}: {
  bookingId: string;
  status: "CONFIRMED" | "COMPLETED" | "CANCELLED";
  label: string;
}) {
  const { run, busy, error } = useServerAction();

  return (
    <div>
      <button
        type="button"
        disabled={busy}
        onClick={() =>
          void run(`/api/bookings/${bookingId}`, {
            method: "PATCH",
            body: JSON.stringify({ status }),
          })
        }
        className="btn-primary"
      >
        {busy ? "Saving..." : label}
      </button>
      <ActionError error={error} />
    </div>
  );
}
