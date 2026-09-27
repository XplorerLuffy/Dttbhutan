"use client";

import { useState } from "react";
import { addDays, format, parseISO } from "date-fns";

export type DepartureRow = {
  startDate: string;
  endDate: string;
  priceOverride: string;
  status: "OPEN" | "LIMITED" | "SOLD_OUT" | "CANCELLED";
  note: string;
};

/**
 * Departure schedule for one package.
 *
 * The end date is filled in from the package's duration the moment a start
 * date is typed, because that is right almost every time and retyping it for
 * every departure of a 12-date season is the kind of chore that stops a
 * schedule from being kept up to date. It stays editable for the departures
 * that genuinely run long or short.
 */
export default function DepartureEditor({
  itineraryId,
  durationDays,
  basePrice,
  initial,
}: {
  itineraryId: string;
  durationDays: number;
  basePrice: number;
  initial: DepartureRow[];
}) {
  const [rows, setRows] = useState<DepartureRow[]>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");

  const dirty = JSON.stringify(rows) !== JSON.stringify(initial);

  function update(i: number, patch: Partial<DepartureRow>) {
    setRows((r) =>
      r.map((row, j) => {
        if (j !== i) return row;
        const next = { ...row, ...patch };
        // A new start date implies the usual end date unless one was set.
        if (patch.startDate && /^\d{4}-\d{2}-\d{2}$/.test(patch.startDate)) {
          const implied = format(addDays(parseISO(patch.startDate), durationDays - 1), "yyyy-MM-dd");
          if (!row.endDate || row.endDate < patch.startDate) next.endDate = implied;
        }
        return next;
      })
    );
  }

  function add() {
    const last = rows[rows.length - 1];
    const start = last?.startDate
      ? format(addDays(parseISO(last.startDate), 7), "yyyy-MM-dd")
      : "";
    setRows((r) => [
      ...r,
      {
        startDate: start,
        endDate: start ? format(addDays(parseISO(start), durationDays - 1), "yyyy-MM-dd") : "",
        priceOverride: "",
        status: "OPEN",
        note: "",
      },
    ]);
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/departures", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itineraryId,
          departures: rows
            .filter((r) => r.startDate && r.endDate)
            .map((r) => ({
              startDate: r.startDate,
              endDate: r.endDate,
              priceOverride: r.priceOverride.trim() ? Number(r.priceOverride) : null,
              status: r.status,
              note: r.note.trim() || null,
            })),
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(typeof b.error === "string" ? b.error : "Could not save departures.");
      }
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save departures.");
    }
  }

  const incomplete = rows.some((r) => !r.startDate || !r.endDate);

  return (
    <div>
      <div className="space-y-2">
        {rows.map((r, i) => (
          <div key={i} className="card grid gap-3 sm:grid-cols-[auto_auto_1fr_auto_auto] sm:items-end">
            <label className="text-sm">
              <span className="mb-1 block font-medium text-stone-700">Departs</span>
              <input
                type="date"
                className="input"
                value={r.startDate}
                onChange={(e) => update(i, { startDate: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-stone-700">Returns</span>
              <input
                type="date"
                className="input"
                value={r.endDate}
                onChange={(e) => update(i, { endDate: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-stone-700">Label (optional)</span>
              <input
                className="input"
                placeholder="e.g. Thimphu Tshechu"
                value={r.note}
                onChange={(e) => update(i, { note: e.target.value })}
              />
            </label>
            <label className="text-sm">
              <span className="mb-1 block font-medium text-stone-700">Price (Nu.)</span>
              <input
                type="number"
                min={0}
                className="input w-32"
                placeholder={String(basePrice)}
                value={r.priceOverride}
                onChange={(e) => update(i, { priceOverride: e.target.value })}
              />
            </label>
            <div className="flex items-end gap-2">
              <label className="text-sm">
                <span className="mb-1 block font-medium text-stone-700">Status</span>
                <select
                  className="input"
                  value={r.status}
                  onChange={(e) => update(i, { status: e.target.value as DepartureRow["status"] })}
                >
                  <option value="OPEN">Open</option>
                  <option value="LIMITED">Limited</option>
                  <option value="SOLD_OUT">Sold out</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </label>
              <button
                type="button"
                onClick={() => setRows((rs) => rs.filter((_, j) => j !== i))}
                aria-label="Remove departure"
                title="Remove departure"
                className="mb-1 rounded border border-stone-200 px-2 py-2 text-sm text-stone-500 hover:bg-stone-50"
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {rows.length === 0 && (
        <p className="text-sm text-stone-600">
          No departures yet. Travellers see an invitation to ask for their own dates until you add
          some.
        </p>
      )}

      <button type="button" onClick={add} className="btn-secondary mt-3">
        + Add departure
      </button>

      <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-stone-200 pt-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || status === "saving" || incomplete}
          className="btn-primary"
        >
          {status === "saving" ? "Saving…" : "Save departures"}
        </button>
        {dirty && status !== "saving" && (
          <button type="button" onClick={() => setRows(initial)} className="btn-secondary">
            Discard
          </button>
        )}
        {incomplete && (
          <p className="text-sm text-amber-700">Every departure needs both dates before saving.</p>
        )}
        {message && (
          <p role="status" className="text-sm text-red-700">
            {message}
          </p>
        )}
        <p className="ml-auto text-xs text-stone-500">
          Leave the price blank to use the package price of Nu. {basePrice.toLocaleString()}.
        </p>
      </div>
    </div>
  );
}
