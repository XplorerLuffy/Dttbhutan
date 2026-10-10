"use client";

import { useState } from "react";

/**
 * Asks the team for a fare on one real route. It goes to the Enquiries inbox
 * like any other message, so the team can reply from the dashboard with the
 * price, the flight times and the ticket. Nothing is "booked" here — the
 * airlines' fares and seats are confirmed by a person before any money moves.
 */
export default function FlightRequestForm({
  summary,
}: {
  /** Plain-text description of the journey, sent as the message. */
  summary: string;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [extra, setExtra] = useState("");
  const [website, setWebsite] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        website,
        subject: "Flight fare request",
        message: `${summary}${extra.trim() ? `\n\nNotes: ${extra.trim()}` : ""}`,
      }),
    }).catch(() => null);
    setBusy(false);
    if (!res) return setError("Couldn't reach the server. Please try again.");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return setError(typeof data.error === "string" ? data.error : "Couldn't send your request.");
    }
    setDone(true);
  }

  if (done) {
    return (
      <p role="status" className="text-sm font-medium text-emerald-700">
        Request sent. We&apos;ll email you the flight options and fare shortly.
      </p>
    );
  }

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-primary">
        Request fare
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-3 w-full max-w-md space-y-2 text-left">
      <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Your name" className="input" />
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="Email" className="input" />
      <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone / WhatsApp (optional)" className="input" />
      <input value={extra} onChange={(e) => setExtra(e.target.value)} placeholder="Anything we should know (optional)" className="input" />
      {/* Honeypot: real people never see or fill this. */}
      <input value={website} onChange={(e) => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={busy} className="btn-primary disabled:opacity-60">
          {busy ? "Sending…" : "Send request"}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="btn-secondary">
          Cancel
        </button>
      </div>
    </form>
  );
}
