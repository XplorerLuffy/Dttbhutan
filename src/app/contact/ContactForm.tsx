"use client";

import { useState } from "react";

export default function ContactForm() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setStatus("sending");

    const form = new FormData(e.currentTarget);
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.get("name"),
        email: form.get("email"),
        phone: form.get("phone"),
        subject: form.get("subject"),
        message: form.get("message"),
        website: form.get("website"),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const fieldError =
        typeof data.error === "object"
          ? Object.values(data.error?.fieldErrors ?? {}).flat()[0]
          : data.error;
      setError((fieldError as string) ?? "Something went wrong. Please try again.");
      setStatus("idle");
      return;
    }

    setStatus("sent");
  }

  if (status === "sent") {
    return (
      <div className="card text-center">
        <p className="font-display text-lg font-semibold text-stone-900">Message sent</p>
        <p className="mt-2 text-sm text-stone-600">
          Thanks for getting in touch — we&apos;ve emailed you a copy. One of our team will
          reply, usually within one working day.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-1 block text-sm font-medium">
            Your name
          </label>
          <input
            id="name"
            name="name"
            required
            minLength={2}
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="phone" className="mb-1 block text-sm font-medium">
            Phone / WhatsApp <span className="text-stone-500">(optional)</span>
          </label>
          <input
            id="phone"
            name="phone"
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>
        <div>
          <label htmlFor="subject" className="mb-1 block text-sm font-medium">
            Subject <span className="text-stone-500">(optional)</span>
          </label>
          <input
            id="subject"
            name="subject"
            className="w-full rounded-md border border-stone-300 px-3 py-2"
          />
        </div>
      </div>

      <div>
        <label htmlFor="message" className="mb-1 block text-sm font-medium">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          minLength={10}
          rows={6}
          placeholder="Tell us where you'd like to go, roughly when, how many of you, and anything you're wondering about."
          className="w-full rounded-md border border-stone-300 px-3 py-2"
        />
      </div>

      {/* Honeypot — hidden from people, tempting to bots. */}
      <div aria-hidden className="absolute left-[-9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="website">Website</label>
        <input id="website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button type="submit" disabled={status === "sending"} className="btn-primary w-full sm:w-auto">
        {status === "sending" ? "Sending..." : "Send message"}
      </button>

      <p className="text-xs text-stone-500">
        We&apos;ll only use your details to reply to this enquiry.
      </p>
    </form>
  );
}
