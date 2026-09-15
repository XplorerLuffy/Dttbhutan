"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function VendorApprovalControls({
  apiPath,
}: {
  apiPath: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [note, setNote] = useState("");

  function setStatus(status: "APPROVED" | "REJECTED" | "SUSPENDED", adminNote?: string) {
    startTransition(async () => {
      await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNote }),
      });
      setShowRejectNote(false);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex gap-2">
        <button
          type="button"
          disabled={isPending}
          onClick={() => setStatus("APPROVED")}
          className="btn-primary"
        >
          Approve
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setShowRejectNote((v) => !v)}
          className="btn-secondary"
        >
          Reject
        </button>
        <button
          type="button"
          disabled={isPending}
          onClick={() => setStatus("SUSPENDED")}
          className="btn-secondary"
        >
          Suspend
        </button>
      </div>
      {showRejectNote && (
        <div className="flex gap-2">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (optional)"
            className="input"
          />
          <button
            type="button"
            disabled={isPending}
            onClick={() => setStatus("REJECTED", note || undefined)}
            className="btn-primary shrink-0"
          >
            Confirm reject
          </button>
        </div>
      )}
    </div>
  );
}
