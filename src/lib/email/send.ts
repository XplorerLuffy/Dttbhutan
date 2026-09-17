import "server-only";

/**
 * Transactional email via Resend's HTTP API.
 *
 * Deliberately a plain `fetch` rather than the `resend` SDK — the API is a
 * single POST, and this keeps the dependency out of the bundle.
 *
 * Two hard rules, because every caller sits on a path where something more
 * important already succeeded (a booking was taken, an enquiry was filed):
 *   1. This never throws. A send failure is logged and swallowed.
 *   2. With no RESEND_API_KEY configured it logs instead of sending, so
 *      local dev and any not-yet-configured deploy still work — and you can
 *      see exactly what would have gone out.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export type EmailMessage = {
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
};

export type SendResult =
  | { ok: true; id: string }
  | { ok: true; skipped: "no-api-key" | "no-from-address" }
  | { ok: false; error: string };

function fromAddress(): string | null {
  // e.g. EMAIL_FROM="Droelma Tours & Travels <bookings@droelma.bt>"
  return process.env.EMAIL_FROM?.trim() || null;
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = fromAddress();

  if (!from) {
    console.warn(`[email] EMAIL_FROM not set — skipping "${message.subject}" to ${message.to}`);
    return { ok: true, skipped: "no-from-address" };
  }

  if (!apiKey) {
    console.info(
      [
        "[email] RESEND_API_KEY not set — not sending. Would have sent:",
        `  to:      ${message.to}`,
        `  from:    ${from}`,
        `  subject: ${message.subject}`,
        `  text:\n${message.text.replace(/^/gm, "    ")}`,
      ].join("\n")
    );
    return { ok: true, skipped: "no-api-key" };
  }

  try {
    const res = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [message.to],
        subject: message.subject,
        html: message.html,
        text: message.text,
        ...(message.replyTo ? { reply_to: message.replyTo } : {}),
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(`[email] Resend returned ${res.status} for "${message.subject}": ${detail}`);
      return { ok: false, error: `Resend responded ${res.status}` };
    }

    const payload = (await res.json().catch(() => ({}))) as { id?: string };
    return { ok: true, id: payload.id ?? "unknown" };
  } catch (err) {
    console.error(`[email] Failed to send "${message.subject}" to ${message.to}`, err);
    return { ok: false, error: err instanceof Error ? err.message : "Unknown error" };
  }
}

/**
 * Sends several messages without letting one failure stop the rest — used
 * where a single event notifies multiple people (e.g. a new booking tells
 * the traveler, the vendor, and the agency).
 */
export async function sendEmails(messages: EmailMessage[]): Promise<SendResult[]> {
  return Promise.all(messages.map(sendEmail));
}

/** The agency's own inbox, for "someone just booked / enquired" alerts. */
export function agencyInbox(): string | null {
  return process.env.AGENCY_NOTIFICATION_EMAIL?.trim() || null;
}
