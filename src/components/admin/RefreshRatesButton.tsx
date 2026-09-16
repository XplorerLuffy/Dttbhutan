"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RefreshRatesButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  function refresh() {
    setMessage(null);
    startTransition(async () => {
      const res = await fetch("/api/admin/exchange-rates/refresh", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Refresh failed");
        return;
      }
      const failedNote = data.failed?.length ? ` (${data.failed.join(", ")} failed)` : "";
      setMessage(`Updated ${data.updated?.length ?? 0} currencies${failedNote}`);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button type="button" onClick={refresh} disabled={isPending} className="btn-secondary">
        {isPending ? "Refreshing..." : "Refresh now"}
      </button>
      {message && <span className="text-sm text-stone-600">{message}</span>}
    </div>
  );
}
