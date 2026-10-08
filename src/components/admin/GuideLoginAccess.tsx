"use client";

import { useState } from "react";
import { describeFailure, describeNetworkError } from "@/components/useServerAction";

/**
 * Whether a guide can log in yet, and how to get them there.
 *
 * Guides apply without an account; approving them emails a link to set a
 * password. This is for when that email didn't arrive or has expired: send a
 * fresh one, or copy the link and paste it into WhatsApp.
 */
export default function GuideLoginAccess({
  guideId,
  hasLogin,
  hasEmail,
  status,
}: {
  guideId: string;
  hasLogin: boolean;
  hasEmail: boolean;
  status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
}) {
  const [busy, setBusy] = useState<"send" | "copy" | null>(null);
  const [message, setMessage] = useState<{ text: string; tone: "ok" | "warn" | "error" } | null>(null);
  const [link, setLink] = useState<string | null>(null);

  if (hasLogin) {
    return <p className="text-xs text-emerald-700">✓ Has a login</p>;
  }
  if (status !== "APPROVED") {
    return (
      <p className="text-xs text-stone-500">
        No login yet — one is offered when you approve the application.
      </p>
    );
  }
  if (!hasEmail) {
    return <p className="text-xs text-stone-500">No login yet, and no email on file to send one to.</p>;
  }

  async function request(send: boolean) {
    if (busy) return;
    setBusy(send ? "send" : "copy");
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/guides/${guideId}/login-link`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ send }),
        signal: AbortSignal.timeout(20_000),
      });
      if (!res.ok) {
        setMessage({ text: await describeFailure(res), tone: "error" });
        return;
      }
      const data = (await res.json()) as { url: string; emailed: string | null };
      setLink(data.url);
      if (send) {
        setMessage(
          data.emailed === "sent"
            ? { text: "Login link emailed.", tone: "ok" }
            : {
                text:
                  data.emailed === "not-configured"
                    ? "Email isn't set up on the site yet, so nothing was sent — copy the link below and send it yourself."
                    : "The email couldn't be sent — copy the link below and send it yourself.",
                tone: "warn",
              }
        );
      } else {
        try {
          await navigator.clipboard.writeText(data.url);
          setMessage({ text: "Link copied — paste it into WhatsApp or an email.", tone: "ok" });
        } catch {
          setMessage({ text: "Copy the link below.", tone: "warn" });
        }
      }
    } catch (err) {
      setMessage({ text: describeNetworkError(err), tone: "error" });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-1.5 text-xs">
      <p className="text-amber-700">No login yet — waiting for them to set a password.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => request(true)}
          disabled={busy !== null}
          className="rounded border border-stone-300 px-2.5 py-1 font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {busy === "send" ? "Sending…" : "Email login link"}
        </button>
        <button
          type="button"
          onClick={() => request(false)}
          disabled={busy !== null}
          className="rounded border border-stone-300 px-2.5 py-1 font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
        >
          {busy === "copy" ? "Making link…" : "Copy login link"}
        </button>
      </div>
      {message && (
        <p
          role={message.tone === "error" ? "alert" : "status"}
          className={
            message.tone === "ok" ? "text-emerald-700" : message.tone === "warn" ? "text-amber-700" : "text-red-600"
          }
        >
          {message.text}
        </p>
      )}
      {link && (
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          aria-label="Login link"
          className="w-full rounded border border-stone-200 bg-stone-50 px-2 py-1 font-mono text-[11px] text-stone-600"
        />
      )}
    </div>
  );
}
