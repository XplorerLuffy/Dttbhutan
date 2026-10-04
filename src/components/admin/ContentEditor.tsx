"use client";

import { useEffect, useState } from "react";
import type { ContentGroup } from "@/lib/content/registry";
import OfficeHoursEditor from "@/components/admin/OfficeHoursEditor";
import { parseSchedule, scheduleError } from "@/lib/officeHours";

/**
 * Renders the whole content admin from the registry, so adding an editable
 * field is a one-line change there and needs no work here.
 *
 * Saves only the fields that actually changed. That keeps the "cleared =
 * back to the designed default" behaviour honest: an untouched field is
 * never written, so it can't quietly acquire a row equal to its default and
 * stop tracking future copy changes.
 *
 * Unsaved edits are kept in this tab's sessionStorage until saved, so a save
 * refused because the admin session ended loses nothing: sign in again and
 * the edits are back, ready to save.
 */
const DRAFT_KEY = "dtt-content-draft";

function readDraft(): Record<string, string> {
  try {
    const parsed = JSON.parse(sessionStorage.getItem(DRAFT_KEY) ?? "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeDraft(draft: Record<string, string>) {
  try {
    if (Object.keys(draft).length) sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    else sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // Private mode or storage full: drafts just aren't kept.
  }
}

export default function ContentEditor({
  groups,
  initial,
}: {
  groups: ContentGroup[];
  initial: Record<string, string>;
}) {
  const [activeGroup, setActiveGroup] = useState(groups[0]?.id ?? "");
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [message, setMessage] = useState("");
  const [signedOut, setSignedOut] = useState(false);
  const [restored, setRestored] = useState(false);

  const group = groups.find((g) => g.id === activeGroup) ?? groups[0];
  const changed = Object.keys(values).filter((k) => values[k] !== initial[k]);

  // An edited opening-hours field with a period that ends before it starts
  // can't be saved; the editor says which day.
  const hoursProblem = groups
    .flatMap((g) => g.fields)
    .filter((f) => f.type === "hours" && changed.includes(f.key) && values[f.key]?.trim())
    .map((f) => {
      const schedule = parseSchedule(values[f.key]);
      return schedule ? scheduleError(schedule) : null;
    })
    .find(Boolean);

  // Bring back edits left unsaved in this tab (e.g. before signing in again).
  useEffect(() => {
    const draft = readDraft();
    const usable = Object.fromEntries(
      Object.entries(draft).filter(([k, v]) => k in initial && typeof v === "string" && v !== initial[k])
    );
    if (Object.keys(usable).length) {
      setValues((v) => ({ ...v, ...usable }));
      setRestored(true);
    }
    // Only on mount: `initial` is the server's copy for this page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    writeDraft(Object.fromEntries(changed.map((k) => [k, values[k]])));
    // `changed` is derived from `values`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

  async function save() {
    setStatus("saving");
    setMessage("");
    setSignedOut(false);
    const payload = Object.fromEntries(changed.map((k) => [k, values[k]]));
    try {
      const res = await fetch("/api/admin/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ values: payload }),
        signal: AbortSignal.timeout(20_000),
      });
      if (res.status === 401 || res.status === 403) {
        setSignedOut(true);
        throw new Error(
          "Not saved: your admin session has ended. Your edits are kept — sign in again, then press Save."
        );
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(typeof body.error === "string" ? body.error : "Could not save changes.");
      }
      writeDraft({});
      setStatus("saved");
      setMessage(`Saved ${changed.length} ${changed.length === 1 ? "change" : "changes"}.`);
      // Reload so the page reflects what the site will now render, and so
      // "changed" resets against the newly-saved values.
      setTimeout(() => window.location.reload(), 700);
    } catch (err) {
      setStatus("error");
      setMessage(err instanceof Error ? err.message : "Could not save changes.");
    }
  }

  return (
    <div className="flex flex-col gap-4 xl:flex-row xl:gap-6">
      {/* Below xl the dashboard's own sidebar already takes the left edge (or
          the screen is a phone), so the sections are a dropdown rather than a
          second column squeezing the form, or a block of wrapped chips
          to scroll past before reaching the fields. */}
      <label className="block xl:hidden">
        <span className="mb-1 block text-sm font-medium text-stone-700">Section</span>
        <select
          value={group.id}
          onChange={(e) => setActiveGroup(e.target.value)}
          className="input"
        >
          {groups.map((g) => {
            const dirty = g.fields.some((f) => values[f.key] !== initial[f.key]);
            return (
              <option key={g.id} value={g.id}>
                {g.label}
                {dirty ? " • edited" : ""}
              </option>
            );
          })}
        </select>
      </label>

      <nav className="hidden xl:block xl:w-56 xl:shrink-0" aria-label="Content sections">
        <ul className="flex flex-col gap-1">
          {groups.map((g) => {
            const dirty = g.fields.some((f) => values[f.key] !== initial[f.key]);
            return (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => setActiveGroup(g.id)}
                  aria-current={g.id === activeGroup ? "true" : undefined}
                  className={`flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors ${
                    g.id === activeGroup
                      ? "bg-brand-700 text-white"
                      : "text-stone-700 hover:bg-stone-100"
                  }`}
                >
                  {g.label}
                  {dirty && (
                    <span
                      aria-label="unsaved changes"
                      className={`h-2 w-2 shrink-0 rounded-full ${g.id === activeGroup ? "bg-white" : "bg-gold-500"}`}
                    />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="min-w-0 flex-1">
        <div className="card">
          <h2 className="font-display text-lg font-semibold text-stone-900">{group.label}</h2>
          {group.description && (
            <p className="mt-1 text-sm text-stone-600">{group.description}</p>
          )}

          <div className="mt-6 space-y-5">
            {group.fields.map((f) => {
              const id = `field-${f.key}`;
              const isDirty = values[f.key] !== initial[f.key];
              return (
                <div key={f.key}>
                  <label htmlFor={f.type === "hours" ? undefined : id} className="mb-1.5 block text-sm font-semibold text-stone-900">
                    {f.label}
                    {isDirty && <span className="ml-2 text-xs font-normal text-gold-700">edited</span>}
                  </label>
                  {f.type === "hours" ? (
                    <OfficeHoursEditor
                      value={values[f.key] ?? ""}
                      onChange={(next) => setValues((v) => ({ ...v, [f.key]: next }))}
                    />
                  ) : f.type === "textarea" ? (
                    <textarea
                      id={id}
                      rows={3}
                      className="input"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  ) : (
                    <input
                      id={id}
                      type={f.type === "tel" ? "tel" : f.type === "email" ? "email" : f.type === "url" ? "url" : "text"}
                      className="input"
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  )}
                  {f.help && <p className="mt-1 text-xs text-stone-500">{f.help}</p>}
                </div>
              );
            })}
          </div>
        </div>

        <div className="sticky bottom-0 z-10 -mx-4 mt-4 flex flex-wrap items-center gap-3 border-t border-stone-200 bg-stone-50/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:mx-0 sm:px-0">
          <button
            type="button"
            onClick={save}
            disabled={changed.length === 0 || status === "saving" || Boolean(hoursProblem)}
            className="btn-primary"
          >
            {status === "saving" ? "Saving…" : `Save ${changed.length || ""} change${changed.length === 1 ? "" : "s"}`.trim()}
          </button>
          {changed.length > 0 && status !== "saving" && (
            <button
              type="button"
              onClick={() => {
                setValues(initial);
                setRestored(false);
              }}
              className="btn-secondary"
            >
              Discard
            </button>
          )}
          {signedOut && (
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="btn-primary"
            >
              Sign in again
            </button>
          )}
          {restored && status === "idle" && changed.length > 0 && (
            <p role="status" className="text-sm text-stone-600">
              Your unsaved edits were brought back — press Save to keep them.
            </p>
          )}
          {message && (
            <p
              role="status"
              className={`text-sm ${status === "error" ? "text-red-700" : "text-pine-700"}`}
            >
              {message}
            </p>
          )}
          <p className="w-full text-xs text-stone-500 sm:ml-auto sm:w-auto">
            Clear a field to restore its original wording.
          </p>
        </div>
      </div>
    </div>
  );
}
