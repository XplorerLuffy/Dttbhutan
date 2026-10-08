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
};

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
}: {
  id: string;
  email: string;
  firstName: string;
  defaultSubject: string;
  past: PastReply[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState(defaultSubject);
  const [body, setBody] = useState(`Dear ${firstName},\n\n`);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/enquiries/${id}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setError(data.error ?? "Couldn't send the email");
      router.refresh();
      return;
    }
    setSent(true);
    setOpen(false);
    setBody(`Dear ${firstName},\n\n`);
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
          <p className="text-xs text-stone-500">
            Their original message is quoted underneath, and your name is added
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
              disabled={busy || !body.trim()}
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
