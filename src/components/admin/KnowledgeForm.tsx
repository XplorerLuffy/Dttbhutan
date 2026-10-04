"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Field, nullableText, readError } from "@/components/admin/vendorFormFields";

export type KnowledgeInitial = {
  id: string;
  title: string;
  content: string;
  sourceType: SourceType;
  category: string;
  visibility: "PUBLIC" | "INTERNAL";
  status: "DRAFT" | "PUBLISHED";
  chunkCount: number;
};

type SourceType = "MANUAL" | "FAQ" | "POLICY" | "UPLOAD";

const SOURCE_TYPES: { value: SourceType; label: string; help: string }[] = [
  { value: "MANUAL", label: "General knowledge", help: "Anything DRUKA should know that has no other home." },
  { value: "FAQ", label: "FAQ answer", help: "A question travellers keep asking, answered once." },
  { value: "POLICY", label: "Policy", help: "Cancellation, payment, visa and refund rules." },
  { value: "UPLOAD", label: "Pasted document", help: "Text taken from a brochure, contract or PDF." },
];

/**
 * Writes one thing DRUKA knows.
 *
 * Saving is not a plain database write: the text is re-chunked and every chunk
 * is re-embedded, which is what makes the edit findable. That takes a few
 * seconds and can partly fail (an unreachable embedding provider), so this
 * reports what actually happened instead of navigating away on a 200 — an
 * admin who was told "saved" while the vectors were skipped would have no way
 * to know the assistant can only find this by keyword.
 */
export default function KnowledgeForm({ initial }: { initial?: KnowledgeInitial }) {
  const router = useRouter();
  const isEdit = Boolean(initial);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [sourceType, setSourceType] = useState<SourceType>(initial?.sourceType ?? "MANUAL");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [visibility, setVisibility] = useState(initial?.visibility ?? "PUBLIC");
  const [status, setStatus] = useState(initial?.status ?? "PUBLISHED");

  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ chunkCount: number; embeddedCount: number; embeddingSkippedReason?: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setResult(null);
    setSaving(true);

    const res = await fetch(isEdit ? `/api/admin/knowledge/${initial!.id}` : "/api/admin/knowledge", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content,
        sourceType,
        category: nullableText(category),
        visibility,
        status,
      }),
    });

    const data = await res.json().catch(() => ({}));
    setSaving(false);

    if (!res.ok) {
      setError(readError(data));
      return;
    }

    setResult(data);

    // After an edit, stay put: the admin is usually still reading what they
    // just wrote, and the embedding report above is the point of not moving.
    if (isEdit) {
      router.refresh();
      return;
    }

    // Refresh AFTER the push, not before. The router caches the list route's
    // payload, so refreshing the page being left behind and then navigating
    // lands on a copy rendered before this document existed — the admin adds
    // something and doesn't see it.
    router.push("/chim/knowledge");
    router.refresh();
  }

  async function handleDelete() {
    if (!initial) return;
    if (!window.confirm(`Delete "${initial.title}"? DRUKA will stop being able to quote it.`)) return;

    setError(null);
    setDeleting(true);
    const res = await fetch(`/api/admin/knowledge/${initial.id}`, { method: "DELETE" });
    setDeleting(false);

    if (!res.ok) {
      setError(readError(await res.json().catch(() => ({}))));
      return;
    }

    router.push("/chim/knowledge");
    router.refresh();
  }

  const busy = saving || deleting;

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <Field label="Title" help="What this is about. DRUKA shows it as the source of an answer.">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          maxLength={200}
          className="input"
          placeholder="Do I need a visa to visit Bhutan?"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Kind" help={SOURCE_TYPES.find((t) => t.value === sourceType)?.help}>
          <select
            value={sourceType}
            onChange={(e) => setSourceType(e.target.value as SourceType)}
            disabled={isEdit}
            className="input disabled:bg-stone-100 disabled:text-stone-500"
          >
            {SOURCE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Category (optional)" help="Groups related documents together. Free text.">
          <input
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            maxLength={80}
            className="input"
            placeholder="Visa & Entry"
          />
        </Field>
      </div>

      <Field
        label="Text"
        help="Plain prose, written the way you would explain it to a traveller. Blank lines separate paragraphs, and DRUKA quotes a paragraph or two at a time — so keep each one able to stand on its own."
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
          minLength={20}
          rows={16}
          className="input text-sm"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field
          label="Who this is for"
          help={
            visibility === "PUBLIC"
              ? "Anyone chatting with DRUKA on the website can be told this."
              : "Only signed-in staff. Never quoted to a visitor."
          }
        >
          <select
            value={visibility}
            onChange={(e) => setVisibility(e.target.value as typeof visibility)}
            className="input"
          >
            <option value="PUBLIC">Travellers (public)</option>
            <option value="INTERNAL">Staff only (internal)</option>
          </select>
        </Field>

        <Field
          label="Status"
          help={
            status === "PUBLISHED"
              ? "DRUKA can use this in answers now."
              : "Saved and searchable to you, but DRUKA will not quote it."
          }
        >
          <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="input">
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft (DRUKA ignores it)</option>
          </select>
        </Field>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {result && (
        <div
          className={`rounded-lg border p-3 text-sm ${
            result.embeddingSkippedReason
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="font-medium">
            Saved — {result.chunkCount} {result.chunkCount === 1 ? "passage" : "passages"},{" "}
            {result.embeddedCount} indexed for meaning-based search.
          </p>
          {result.embeddingSkippedReason && (
            <p className="mt-1 text-xs">
              The embedding service could not be reached, so DRUKA will only find this by
              keyword until it is saved again. Reason: {result.embeddingSkippedReason}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" disabled={busy} className="btn-primary flex-1">
          {saving ? "Saving and indexing…" : isEdit ? "Save and re-index" : "Add to DRUKA's knowledge"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        )}
      </div>
    </form>
  );
}
