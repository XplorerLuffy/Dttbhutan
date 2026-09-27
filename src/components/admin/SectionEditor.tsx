"use client";

import { useState } from "react";
import type { Section } from "@/lib/content/sections";

type Draft = { group: string; heading: string; body: string };

/**
 * Edits one long-form page as an ordered list of sections.
 *
 * The whole list is saved in a single request, so reordering, adding and
 * deleting are all just local array operations until Save — there is no
 * half-applied state where a clause has moved but its neighbour hasn't.
 */
export default function SectionEditor({
  page,
  pageLabel,
  grouped,
  initial,
  usingDefaults,
}: {
  page: string;
  pageLabel: string;
  grouped: boolean;
  initial: Section[];
  usingDefaults: boolean;
}) {
  const toDraft = (s: Section): Draft => ({
    group: s.group ?? "",
    heading: s.heading,
    body: s.body,
  });

  const [drafts, setDrafts] = useState<Draft[]>(initial.map(toDraft));
  const [status, setStatus] = useState<"idle" | "saving" | "error">("idle");
  const [message, setMessage] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const baseline = JSON.stringify(initial.map(toDraft));
  const dirty = JSON.stringify(drafts) !== baseline;

  function update(i: number, patch: Partial<Draft>) {
    setDrafts((d) => d.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  }
  function move(i: number, delta: number) {
    const j = i + delta;
    if (j < 0 || j >= drafts.length) return;
    setDrafts((d) => {
      const next = [...d];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setOpenIndex(j);
  }
  function remove(i: number) {
    setDrafts((d) => d.filter((_, j) => j !== i));
    setOpenIndex(null);
  }
  function add() {
    setDrafts((d) => [...d, { group: grouped ? (d[d.length - 1]?.group ?? "") : "", heading: "", body: "" }]);
    setOpenIndex(drafts.length);
  }

  async function save() {
    setStatus("saving");
    setMessage("");
    try {
      const res = await fetch("/api/admin/sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          page,
          sections: drafts.map((d) => ({
            group: grouped ? d.group.trim() || null : null,
            heading: d.heading.trim(),
            body: d.body,
          })),
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(typeof b.error === "string" ? b.error : "Could not save changes.");
      }
      window.location.reload();
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save changes.");
    }
  }

  const blankHeading = drafts.some((d) => !d.heading.trim());

  return (
    <div>
      {usingDefaults && (
        <p className="mb-4 rounded-lg border border-brand-200 bg-brand-50 p-3 text-sm text-brand-900">
          This page is showing its built-in wording. Saving any change here takes over the page
          completely — after that, these sections are the page and the built-in text is no
          longer used.
        </p>
      )}

      <div className="space-y-3">
        {drafts.map((d, i) => {
          const open = openIndex === i;
          return (
            <div key={i} className="card">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => setOpenIndex(open ? null : i)}
                  className="min-w-0 flex-1 text-left"
                  aria-expanded={open}
                >
                  <span className="block truncate font-semibold text-stone-900">
                    {d.heading.trim() || <span className="text-stone-400">Untitled section</span>}
                  </span>
                  {grouped && d.group && (
                    <span className="mt-0.5 block text-xs text-stone-500">{d.group}</span>
                  )}
                </button>
                <div className="flex shrink-0 items-center gap-1">
                  <IconButton label="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</IconButton>
                  <IconButton label="Move down" disabled={i === drafts.length - 1} onClick={() => move(i, 1)}>↓</IconButton>
                  <IconButton label="Delete section" onClick={() => remove(i)}>✕</IconButton>
                </div>
              </div>

              {open && (
                <div className="mt-4 space-y-3 border-t border-stone-100 pt-4">
                  {grouped && (
                    <label className="block text-sm">
                      <span className="mb-1.5 block font-semibold text-stone-900">Category</span>
                      <input
                        className="input"
                        value={d.group}
                        onChange={(e) => update(i, { group: e.target.value })}
                        placeholder="e.g. Visiting Bhutan"
                      />
                      <span className="mt-1 block text-xs text-stone-500">
                        Questions sharing a category are grouped together, in this order.
                      </span>
                    </label>
                  )}
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-semibold text-stone-900">
                      {grouped ? "Question" : "Clause heading"}
                    </span>
                    <input
                      className="input"
                      value={d.heading}
                      onChange={(e) => update(i, { heading: e.target.value })}
                    />
                  </label>
                  <label className="block text-sm">
                    <span className="mb-1.5 block font-semibold text-stone-900">
                      {grouped ? "Answer" : "Clause text"}
                    </span>
                    <textarea
                      className="input font-mono text-xs"
                      rows={8}
                      value={d.body}
                      onChange={(e) => update(i, { body: e.target.value })}
                    />
                  </label>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button type="button" onClick={add} className="btn-secondary mt-3">
        + Add {grouped ? "question" : "clause"}
      </button>

      <div className="sticky bottom-0 mt-4 flex flex-wrap items-center gap-3 border-t border-stone-200 bg-stone-50 py-3">
        <button
          type="button"
          onClick={save}
          disabled={!dirty || status === "saving" || blankHeading}
          className="btn-primary"
        >
          {status === "saving" ? "Saving…" : `Save ${pageLabel}`}
        </button>
        {dirty && status !== "saving" && (
          <button type="button" onClick={() => setDrafts(initial.map(toDraft))} className="btn-secondary">
            Discard
          </button>
        )}
        {blankHeading && (
          <p className="text-sm text-amber-700">
            Every section needs a {grouped ? "question" : "heading"} before this can be saved.
          </p>
        )}
        {message && <p role="status" className="text-sm text-red-700">{message}</p>}
      </div>

      <details className="mt-8 text-sm text-stone-600">
        <summary className="cursor-pointer font-semibold text-stone-800">
          Formatting you can use
        </summary>
        <ul className="mt-2 space-y-1 pl-4">
          <li>Leave a blank line between paragraphs.</li>
          <li><code>- </code> at the start of a line makes a bullet.</li>
          <li><code>**bold**</code> for bold text.</li>
          <li><code>[label](/contact)</code> for a link. Only site pages and https:// addresses work.</li>
          <li><code>==30 days==</code> highlights a figure as still needing confirmation.</li>
          <li><code>{"{{cancellation-tiers}}"}</code> on its own line inserts the refund table.</li>
          <li><code>{"{{company-identity}}"}</code> inserts the registered name and TCB licence.</li>
        </ul>
      </details>
    </div>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded border border-stone-200 px-2 py-1 text-sm text-stone-600 hover:bg-stone-50 disabled:opacity-30"
    >
      {children}
    </button>
  );
}
