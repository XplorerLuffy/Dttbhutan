import { LEGAL_REVIEWED, LEGAL_LAST_UPDATED } from "@/lib/legal";

/**
 * Shared frame for Terms / Privacy / Cancellation.
 *
 * The banner is driven by LEGAL_REVIEWED in src/lib/legal.ts. These pages
 * ship as drafts written from standard tour-operator practice, not as
 * vetted legal advice — showing that plainly is more honest than passing
 * an unreviewed draft off as binding terms. Flip the flag once a
 * qualified reviewer has signed them off and the banner disappears.
 */
export default function LegalPageShell({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-display text-3xl font-bold text-stone-900">{title}</h1>
      <p className="mb-2 text-stone-600">{intro}</p>
      <p className="mb-6 text-xs text-stone-500">Last updated: {LEGAL_LAST_UPDATED}</p>

      {!LEGAL_REVIEWED && (
        <div className="mb-6 rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <p className="font-semibold">Draft — pending legal review</p>
          <p className="mt-1">
            This document was drafted from standard tour-operator practice and has not yet
            been reviewed by a qualified legal professional. Specific figures and timeframes
            need to be confirmed against how this business actually operates before these
            terms are relied on.
          </p>
        </div>
      )}

      <div className="card space-y-6 text-sm leading-relaxed text-stone-700">{children}</div>
    </div>
  );
}

export function Clause({ heading, children }: { heading: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-lg font-semibold text-stone-900">{heading}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

/** Marks a figure that must be confirmed against real business policy. */
export function Confirm({ children }: { children: React.ReactNode }) {
  if (LEGAL_REVIEWED) return <>{children}</>;
  return (
    <mark
      className="rounded bg-amber-100 px-1 text-amber-900"
      title="Confirm this value reflects your actual policy"
    >
      {children}
    </mark>
  );
}
