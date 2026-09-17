"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const NEXT_STATUS: Record<string, { label: string; value: string }[]> = {
  NEW: [
    { label: "Mark in progress", value: "IN_PROGRESS" },
    { label: "Close", value: "CLOSED" },
  ],
  IN_PROGRESS: [{ label: "Close", value: "CLOSED" }],
  CLOSED: [{ label: "Reopen", value: "IN_PROGRESS" }],
};

export default function EnquiryStatusControls({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function setStatus(value: string) {
    setBusy(true);
    setError(null);

    const res = await fetch(`/api/admin/enquiries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't update");
      setBusy(false);
      return;
    }

    router.refresh();
    setBusy(false);
  }

  return (
    <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap gap-2">
        {(NEXT_STATUS[status] ?? []).map((action) => (
          <button
            key={action.value}
            type="button"
            disabled={busy}
            onClick={() => setStatus(action.value)}
            className="btn-secondary disabled:opacity-50"
          >
            {action.label}
          </button>
        ))}
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
