"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function RegenerateReportButton({ tripId }: { tripId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          await fetch(`/api/admin/gps/trips/${tripId}/regenerate`, { method: "POST" });
          router.refresh();
        });
      }}
      className="btn-secondary"
    >
      {isPending ? "Recalculating..." : "Recalculate from GPS trail"}
    </button>
  );
}
