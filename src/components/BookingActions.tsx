"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function CancelBookingButton({ bookingId }: { bookingId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirm("Cancel this booking?")) return;
        startTransition(async () => {
          await fetch(`/api/bookings/${bookingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: "CANCELLED" }),
          });
          router.refresh();
        });
      }}
      className="btn-secondary"
    >
      {isPending ? "Cancelling..." : "Cancel booking"}
    </button>
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await fetch(`/api/bookings/${bookingId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          router.refresh();
        });
      }}
      className="btn-primary"
    >
      {isPending ? "Saving..." : label}
    </button>
  );
}
