"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STATUS_OPTIONS = ["NEW", "IN_REVIEW", "QUOTED", "CLOSED"] as const;

export default function CustomTourRequestControls({
  requestId,
  currentStatus,
  currentAdminNote,
}: {
  requestId: string;
  currentStatus: string;
  currentAdminNote: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [note, setNote] = useState(currentAdminNote ?? "");

  function save(status: string) {
    startTransition(async () => {
      await fetch(`/api/admin/custom-tour-requests/${requestId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote: note || undefined }),
      });
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <select
        defaultValue={currentStatus}
        disabled={isPending}
        onChange={(e) => save(e.target.value)}
        className="input w-auto"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </select>
      <div className="flex gap-2">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Internal note (optional)"
          className="input"
        />
        <button
          type="button"
          disabled={isPending}
          onClick={() => save(currentStatus)}
          className="btn-secondary shrink-0"
        >
          Save note
        </button>
      </div>
    </div>
  );
}
