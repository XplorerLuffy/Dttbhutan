"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type PastReply = {
  id: string;
  subject: string;
  body: string;
  status: string;
  error: string | null;
  by: string | null;
  at: string;
  quote: { label: string; amount: number; basis: "PER_PERSON" | "TOTAL"; travelers?: number | null } | null;
  attachments: { name: string; bytes: number }[] | null;
};

export type PackageOption = {
  slug: string;
  title: string;
  durationDays: number;
  pricePerPerson: number;
};

const MAX_TOTAL = 4 * 1024 * 1024;
const fmtKb = (n: number) => (n >= 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

/**
 * Reply to an enquiry by email without leaving the dashboard. The email goes
 * to the address the person gave, signed with the admin's name; their answer
 * comes back to the agency inbox. Earlier replies are listed so nobody answers
 * twice without knowing.
 */
export default function EnquiryReply({
  id,
  email,
  firstName,
  defaultSubject,
  past,
  packages,
}: {
  id: string;
  email: string;
  firstName: string;
  defaultSubject: string;
  past: PastReply[];
  packages: PackageOption[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(`Dear ${firstName},\n\n`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pkg, setPkg] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [withPrice, setWithPrice] = useState(false);
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [basis, setBasis] = useState<"PER_PERSON" | "TOTAL">("PER_PERSON");
  const [travelers, setTravelers] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [note, setNote] = useState("");
  const filesSize = files.reduce((n, f) => n + f.size, 0);

  function pickPackage(slug: string) {
    setPkg(slug);
    const p = packages.find((x) => x.slug === slug);
    if (p) {
      setWithPrice(true);
      setLabel(`${p.title} (${p.durationDays} days)`);
      setAmount(String(p.pricePerPerson));
      setBasis("PER_PERSON");
    }
  }

  function reset() {
    setBody(`Dear ${firstName},\n\n`);
    setPkg("");
    setFiles([]);
    setWithPrice(false);
    setLabel("");
    setAmount("");
    setTravelers("");
    setValidUntil("");
    setNote("");
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const fd = new FormData();
    fd.set("subject", subject);
    fd.set("body", body);
    if (pkg) fd.set("itinerarySlug", pkg);
    if (withPrice) {
      fd.set(
        "quote",
        JSON.stringify({
          label,
          amount,
          basis,
          travelers: basis === "PER_PERSON" && travelers ? travelers : null,
          validUntil: validUntil || null,
          note: note || null,
        })
      );
    }
    for (const f of files) fd.append("files", f);
    const res = await fetch(`/api/admin/enquiries/${id}/reply`, { method: "POST", body: fd }).catch(() => null);
    if (!res) {
      setBusy(false);
      setError("Couldn't reach the server. Check your connection and try again.");
      return;
    }
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't send the email");
      router.refresh();
      return;
    }
    setSent(true);
    setOpen(false);
    reset();
    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      {past.length > 0 && (
        <ul className="mb-3 space-y-2">
          {past.map((r) => (
            <li
              key={r.id}
              className={`rounded-xl border px-3 py-2 text-sm ${
                r.status === "SENT"
                  ? "border-emerald-200 bg-emerald-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p className="flex flex-wrap items-center justify-between gap-x-3 text-xs text-stone-600">
                <span>
                  <strong
                    className={
                      r.status === "SENT" ? "text-emerald-800" : "text-red-800"
                    }
                  >
                    {r.status === "SENT" ? "Reply sent" : "Not sent"}
                  </strong>{" "}
                  by {r.by ?? "the team"} ·{" "}
                  {new Date(r.at).toLocaleString("en-GB")}
                </span>
                <span>{r.subject}</span>
              </p>
              <p className="mt-1 whitespace-pre-wrap text-stone-800">
                {r.body}
              </p>
              {(r.quote || r.attachments?.length) && (
                <p className="mt-1.5 text-xs text-stone-600">
                  {r.quote && (
                    <span className="mr-3">
                      💰 Nu. {r.quote.amount.toLocaleString("en-IN")}
                      {r.quote.basis === "PER_PERSON" ? " per person" : " total"} — {r.quote.label}
                    </span>
                  )}
                  {r.attachments?.length ? (
                    <span>📎 {r.attachments.map((a) => a.name).join(", ")}</span>
                  ) : null}
                </p>
              )}
              {r.error && (
                <p className="mt-1 text-xs text-red-700">{r.error}</p>
              )}
            </li>
          ))}
        </ul>
      )}

      {sent && !open && (
        <p role="status" className="mb-2 text-sm font-medium text-emerald-700">
          Email sent to {email}.
        </p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setSent(false);
          }}
          className="btn-primary"
        >
          Reply by email
        </button>
      ) : (
        <form
          onSubmit={send}
          className="space-y-3 rounded-xl border border-stone-200 bg-stone-50/60 p-3 sm:p-4"
        >
          <p className="text-sm text-stone-600">
            To: <strong className="break-all text-stone-900">{email}</strong>
          </p>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-800">
              Subject
            </span>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              maxLength={200}
              required
              className="input"
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-stone-800">
              Your reply
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={9}
              required
              className="input"
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Attach a package itinerary (PDF)</span>
              <select value={pkg} onChange={(e) => pickPackage(e.target.value)} className="input">
                <option value="">None</option>
                {packages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-stone-800">Attach files</span>
              <input
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,image/jpeg,image/png,image/webp"
                onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
                className="block w-full text-sm text-stone-700 file:mr-3 file:rounded-lg file:border-0 file:bg-stone-200 file:px-3 file:py-2 file:text-sm file:font-medium"
              />
              <span className={`mt-1 block text-xs ${filesSize > MAX_TOTAL ? "text-red-600" : "text-stone-500"}`}>
                {files.length ? `${files.length} file(s), ${fmtKb(filesSize)} of 4 MB.` : "Up to 5 files, 4 MB in total."}
              </span>
            </label>
          </div>

          <div className="rounded-xl border border-stone-200 bg-white p-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-stone-800">
              <input
                type="checkbox"
                checked={withPrice}
                onChange={(e) => setWithPrice(e.target.checked)}
                className="h-4 w-4 accent-brand-700"
              />
              Include a price quotation
            </label>
            {withPrice && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-stone-700">What the price is for</span>
                  <input value={label} onChange={(e) => setLabel(e.target.value)} maxLength={200} className="input" placeholder="e.g. 7-day Cultural Tour" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-stone-700">Price (Nu.)</span>
                  <input type="number" min="1" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-stone-700">Price is</span>
                  <select value={basis} onChange={(e) => setBasis(e.target.value as "PER_PERSON" | "TOTAL")} className="input">
                    <option value="PER_PERSON">Per person</option>
                    <option value="TOTAL">Total for the group</option>
                  </select>
                </label>
                {basis === "PER_PERSON" && (
                  <label className="block">
                    <span className="mb-1 block text-xs font-medium text-stone-700">Travellers (shows the total)</span>
                    <input type="number" min="1" max="200" value={travelers} onChange={(e) => setTravelers(e.target.value)} className="input" />
                  </label>
                )}
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-stone-700">Valid until</span>
                  <input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="input" />
                </label>
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs font-medium text-stone-700">Note (what is included, optional)</span>
                  <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} className="input" />
                </label>
              </div>
            )}
          </div>

          <p className="text-xs text-stone-500">
            Sent on the company letterhead with the DTT logo. Their original message is quoted underneath, and the signature is Chimi
            as the signature. When they answer, it arrives in your own inbox.
          </p>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={busy || !body.trim() || filesSize > MAX_TOTAL}
              className="btn-primary disabled:opacity-50"
            >
              {busy ? "Sending…" : "Send email"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
