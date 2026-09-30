"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Summary = {
  packages: number;
  destinations: number;
  articles: number;
  documents: number;
  chunks: number;
  embedded: number;
  embeddingSkippedReason?: string;
};

/** One request per kind, in this order. A single request covering all three
 * would spend more than a minute on embedding calls and be cut off partway —
 * see the note on /api/admin/knowledge/sync. */
const SCOPES = [
  { scope: "packages", label: "package tours" },
  { scope: "destinations", label: "destinations" },
  { scope: "articles", label: "travel guide articles" },
] as const;

/**
 * Re-reads the website's own content into DRUKA's knowledge base.
 *
 * This is how an edited package or a new article becomes something the
 * assistant can talk about in prose. The grounding tools already read prices
 * and dates straight from the database, so those are never stale — what this
 * refreshes is the descriptive text retrieval searches through.
 */
export default function KnowledgeSyncButton() {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);
  const [totals, setTotals] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setError(null);
    setTotals(null);

    const combined: Summary = {
      packages: 0,
      destinations: 0,
      articles: 0,
      documents: 0,
      chunks: 0,
      embedded: 0,
    };

    for (const { scope, label } of SCOPES) {
      setRunning(label);

      const res = await fetch("/api/admin/knowledge/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scope }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setRunning(null);
        // Whatever finished before the failure is real work, so it's reported
        // rather than thrown away — the admin needs to know how far it got.
        setTotals(combined);
        setError(
          typeof data.error === "string"
            ? data.error
            : `Refreshing ${label} failed. Everything before it was indexed.`
        );
        router.refresh();
        return;
      }

      const summary = data as Summary;
      combined.packages += summary.packages;
      combined.destinations += summary.destinations;
      combined.articles += summary.articles;
      combined.documents += summary.documents;
      combined.chunks += summary.chunks;
      combined.embedded += summary.embedded;
      if (summary.embeddingSkippedReason && !combined.embeddingSkippedReason) {
        combined.embeddingSkippedReason = summary.embeddingSkippedReason;
      }
    }

    setRunning(null);
    setTotals(combined);
    router.refresh();
  }

  return (
    <div>
      <button type="button" onClick={refresh} disabled={running !== null} className="btn-secondary">
        {running ? `Reading ${running}…` : "Refresh from website content"}
      </button>

      {totals && (
        <div
          className={`mt-3 rounded-lg border p-3 text-sm ${
            error || totals.embeddingSkippedReason
              ? "border-amber-200 bg-amber-50 text-amber-900"
              : "border-emerald-200 bg-emerald-50 text-emerald-900"
          }`}
        >
          <p className="font-medium">
            {totals.packages} package {totals.packages === 1 ? "tour" : "tours"}, {totals.destinations}{" "}
            {totals.destinations === 1 ? "destination" : "destinations"} and {totals.articles}{" "}
            {totals.articles === 1 ? "article" : "articles"} re-indexed — {totals.chunks}{" "}
            {totals.chunks === 1 ? "passage" : "passages"}, {totals.embedded} searchable by meaning.
          </p>
          {error && <p className="mt-1 text-xs">{error}</p>}
          {totals.embeddingSkippedReason && (
            <p className="mt-1 text-xs">
              The embedding service stopped responding partway through, so some passages are keyword-only
              until this is run again. Reason: {totals.embeddingSkippedReason}
            </p>
          )}
        </div>
      )}

      {error && !totals && <p className="mt-3 text-sm text-red-600">{error}</p>}
    </div>
  );
}
