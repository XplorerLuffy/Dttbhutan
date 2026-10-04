import "server-only";
import nodemailer, { type Transporter } from "nodemailer";

/**
 * Transactional email, through whichever sender is configured:
 *
 *   1. SMTP — SMTP_USER + SMTP_PASS (host/port default to Gmail). The simple
 *      option for a small agency: the site sends through the owner's own
 *      Gmail account with a Google "app password", no email service to sign
 *      up for. Gmail sends as that account whatever EMAIL_FROM says.
 *   2. Resend's HTTP API — RESEND_API_KEY + EMAIL_FROM, for sending from an
 *      address on the agency's own domain at volume. A plain `fetch` rather
 *      than the SDK: the API is a single POST.
 *   3. Neither — the message is logged instead, so local dev and any
 *      not-yet-configured deploy still work and show what would have gone out.
 *
 * One hard rule, because every caller sits on a path where something more
 * important already succeeded (a booking was taken, an enquiry was filed):
 * this never throws. A send failure is logged and swallowed.
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

function smtpConfig() {
  const user = process.env.SMTP_USER?.trim();
  // Google shows app passwords in groups of four ("abcd efgh ijkl mnop");
  // pasted that way the spaces would make the login fail.
  const pass = process.env.SMTP_PASS?.replace(/\s+/g, "");
  if (!user || !pass) return null;
  const port = Number(process.env.SMTP_PORT) || 465;
  return {
    host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
    port,
    // 465 is TLS from the first byte; 587 upgrades with STARTTLS.
    secure: port === 465,
    auth: { user, pass },
    // nodemailer's defaults wait up to 2 minutes to connect and 10 for a
    // reply. Every send here sits inside a request someone is waiting on —
    // an admin clicking Approve, a traveller booking — so a slow or blocked
    // mail server must fail in seconds, not hold the button for minutes.
    connectionTimeout: 8_000,
    greetingTimeout: 8_000,
    socketTimeout: 10_000,
  };
}

let smtpTransport: Transporter | null = null;

async function sendViaSmtp(
  message: EmailMessage,
  config: NonNullable<ReturnType<typeof smtpConfig>>
): Promise<SendResult> {
  smtpTransport ??= nodemailer.createTransport(config);
  try {
    const info = await smtpTransport.sendMail({
      from: fromAddress() ?? `"Droelma Tours & Travels" <${config.auth.user}>`,
      to: message.to,
      subject: message.subject,
      html: message.html,
      text: message.text,
      ...(message.replyTo ? { replyTo: message.replyTo } : {}),
    });
    return { ok: true, id: info.messageId };
  } catch (err) {
    console.error(`[email] SMTP failed to send "${message.subject}" to ${message.to}`, err);
    return { ok: false, error: err instanceof Error ? err.message : "SMTP error" };
  }
}

export async function sendEmail(message: EmailMessage): Promise<SendResult> {
  const smtp = smtpConfig();
  if (smtp) return sendViaSmtp(message, smtp);

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
      // Same reasoning as the SMTP timeouts: never let email hold a request.
      signal: AbortSignal.timeout(10_000),
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
