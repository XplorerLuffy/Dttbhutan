"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { describeFailure, describeNetworkError } from "@/components/useServerAction";

type Status = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
type Action = Exclude<Status, "PENDING">;

/** The current status reads as a status, not a button: coloured, inactive. */
const CURRENT_STYLE: Record<Action, string> = {
  APPROVED: "border-emerald-300 bg-emerald-50 text-emerald-800",
  REJECTED: "border-red-300 bg-red-50 text-red-800",
  SUSPENDED: "border-amber-300 bg-amber-50 text-amber-800",
};

const LABEL: Record<Action, { idle: string; busy: string; done: string }> = {
  APPROVED: { idle: "Approve", busy: "Approving…", done: "Approved ✓" },
  REJECTED: { idle: "Reject", busy: "Rejecting…", done: "Rejected" },
  SUSPENDED: { idle: "Suspend", busy: "Suspending…", done: "Suspended" },
};

/**
 * Approve / reject / suspend for one vendor listing.
 *
 * Built to always answer the click. The earlier version disabled every button
 * until the request *and* a full page refresh had finished, ignored the
 * response, and showed no current state — so clicking Approve on a listing
 * that was already approved, or a request that failed, looked identical to
 * the button simply not working, and a slow request left the row greyed out.
 *
 * Now: the button matching the listing's current status shows it ("Approved
 * ✓") and is inactive; only the clicked button shows progress; a failure is
 * shown in words; the status updates the moment the server confirms, with the
 * page refresh happening afterwards in the background.
 */
export default function VendorApprovalControls({
  apiPath,
  status,
}: {
  apiPath: string;
  status: Status;
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<Status>(status);
  const [busy, setBusy] = useState<Action | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRejectNote, setShowRejectNote] = useState(false);
  const [note, setNote] = useState("");

  async function setStatus(next: Action, adminNote?: string) {
    if (busy) return;
    setBusy(next);
    setError(null);
    try {
      const res = await fetch(apiPath, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next, adminNote }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        setError(await describeFailure(res));
        return;
      }
      setCurrent(next);
      setShowRejectNote(false);
      setNote("");
      // Brings the badge, notes and counts up to date. Deliberately not
      // awaited: the buttons are already free and showing the new status.
      router.refresh();
    } catch (err) {
      setError(describeNetworkError(err));
    } finally {
      setBusy(null);
    }
  }

  function buttonFor(action: Action, onClick: () => void, primary = false) {
    const isCurrent = current === action;
    const label =
      busy === action ? LABEL[action].busy : isCurrent ? LABEL[action].done : LABEL[action].idle;
    return (
      <button
        type="button"
        disabled={isCurrent || busy !== null}
        aria-pressed={isCurrent}
        onClick={onClick}
        className={
          isCurrent
            ? `cursor-default rounded-md border px-4 py-2 font-semibold ${CURRENT_STYLE[action]}`
            : primary
              ? "btn-primary"
              : "btn-secondary"
        }
      >
        {label}
      </button>
    );
  }

  return (
    <div className="flex w-full flex-col items-start gap-2 sm:w-auto sm:items-end">
      <div className="flex flex-wrap gap-2">
        {buttonFor("APPROVED", () => setStatus("APPROVED"), true)}
        {buttonFor("REJECTED", () => setShowRejectNote((v) => !v))}
        {buttonFor("SUSPENDED", () => setStatus("SUSPENDED"))}
      </div>

      {showRejectNote && current !== "REJECTED" && (
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Reason (optional, sent to the vendor)"
            className="input min-w-0 flex-1 sm:flex-initial"
          />
          <button
            type="button"
            disabled={busy !== null}
            onClick={() => setStatus("REJECTED", note || undefined)}
            className="btn-primary shrink-0"
          >
            {busy === "REJECTED" ? "Rejecting…" : "Confirm reject"}
          </button>
        </div>
      )}

      {error && (
        <p role="alert" className="max-w-xs text-sm text-red-600 sm:text-right">
          {error}
        </p>
      )}
    </div>
  );
}
