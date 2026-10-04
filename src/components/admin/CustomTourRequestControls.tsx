"use client";

import { useState } from "react";
import { useServerAction } from "@/components/useServerAction";

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
  const { run, busy: isPending, error } = useServerAction();
  const [note, setNote] = useState(currentAdminNote ?? "");
  const [saved, setSaved] = useState(false);

  async function save(status: string) {
    setSaved(false);
    const ok = await run(`/api/admin/custom-tour-requests/${requestId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, adminNote: note || undefined }),
    });
    setSaved(ok);
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
          {isPending ? "Saving..." : "Save note"}
        </button>
      </div>
      {saved && !error && <p className="text-sm text-emerald-700">Saved</p>}
      {error && (
        <p role="alert" className="max-w-xs text-right text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
