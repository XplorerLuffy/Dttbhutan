import "server-only";
import { siteUrl } from "@/lib/seo";

/**
 * Email content. Every template returns a subject plus both an HTML and a
 * plain-text body — text isn't optional politeness, it's what shows up in
 * notification previews and in clients with images/HTML disabled.
 *
 * Styles are inline because email clients strip <style> blocks, and the
 * outer table wrapper is there because Outlook ignores max-width on a div.
 */

const BRAND = "Droelma Tours & Travels";
const BRAND_BLUE = "#0b5ea8";
const INK = "#1c1917";
const MUTED = "#78716c";
const BORDER = "#e7e5e4";

// The same address the sitemap and the PDF use, so an email can never link
// somewhere the rest of the site does not. Re-exported for existing callers.
export { siteUrl };

export function formatBTN(amount: number | { toString(): string }): string {
  return `Nu. ${Number(amount).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function formatDateRange(start: Date, end: Date): string {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** A label/value list rendered as rows — the body of most of these emails. */
export type DetailRow = { label: string; value: string };

function detailsHtml(rows: DetailRow[]): string {
  return rows
    .map(
      ({ label, value }) => `
      <tr>
        <td style="padding:6px 0;color:${MUTED};font-size:14px;vertical-align:top;width:40%;">${escapeHtml(label)}</td>
        <td style="padding:6px 0;color:${INK};font-size:14px;font-weight:500;">${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");
}

function detailsText(rows: DetailRow[]): string {
  return rows.map(({ label, value }) => `${label}: ${value}`).join("\n");
}

function button(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;">
      <tr>
        <td style="background:${BRAND_BLUE};border-radius:6px;">
          <a href="${href}" style="display:inline-block;padding:12px 22px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

function layout({ heading, intro, rows, cta, outro }: EmailBody): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f1;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f1;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;">
        <tr>
          <td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
            <a href="${siteUrl()}" style="color:${BRAND_BLUE};font-size:17px;font-weight:700;text-decoration:none;font-family:Georgia,serif;">${BRAND}</a>
          </td>
        </tr>
        <tr>
          <td style="padding:28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <h1 style="margin:0 0 12px;font-size:20px;line-height:1.3;color:${INK};">${escapeHtml(heading)}</h1>
            <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${INK};">${escapeHtml(intro)}</p>
            ${rows?.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BORDER};border-bottom:1px solid ${BORDER};padding:4px 0;">${detailsHtml(rows)}</table>` : ""}
            ${cta ? button(cta.label, cta.href) : ""}
            ${outro ? `<p style="margin:20px 0 0;font-size:14px;line-height:1.6;color:${MUTED};">${escapeHtml(outro)}</p>` : ""}
          </td>
        </tr>
        <tr>
          <td style="padding:18px 28px;border-top:1px solid ${BORDER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
            <p style="margin:0;font-size:12px;line-height:1.5;color:${MUTED};">
              © ${new Date().getFullYear()} ${BRAND}, Bhutan.<br>
              <a href="${siteUrl()}" style="color:${MUTED};">${siteUrl().replace(/^https?:\/\//, "")}</a>
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function layoutText({ heading, intro, rows, cta, outro }: EmailBody): string {
  return [
    heading,
    "",
    intro,
    rows?.length ? `\n${detailsText(rows)}` : "",
    cta ? `\n${cta.label}: ${cta.href}` : "",
    outro ? `\n${outro}` : "",
    "",
    "—",
    `${BRAND}, Bhutan`,
    siteUrl(),
  ]
    .filter((part) => part !== "")
    .join("\n");
}

type EmailBody = {
  heading: string;
  intro: string;
  rows?: DetailRow[];
  cta?: { label: string; href: string };
  outro?: string;
};

export type RenderedEmail = { subject: string; html: string; text: string };

function render(subject: string, body: EmailBody): RenderedEmail {
  return { subject, html: layout(body), text: layoutText(body) };
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

export function bookingReceivedToTraveler(input: {
  travelerName: string;
  reference: string;
  what: string;
  dates: string;
  total: string;
  pending: boolean;
}): RenderedEmail {
  return render(
    `Booking received — ${input.what}`,
    {
      heading: `Thanks, ${input.travelerName.split(" ")[0]} — we've got your booking`,
      intro: input.pending
        ? "We've received your booking and it's now awaiting confirmation. You'll get another email as soon as it's confirmed."
        : "Your booking is confirmed. Details are below.",
      rows: [
        { label: "Booking reference", value: input.reference },
        { label: "What", value: input.what },
        { label: "Dates", value: input.dates },
        { label: "Total", value: input.total },
        { label: "Status", value: input.pending ? "Awaiting confirmation" : "Confirmed" },
      ],
      cta: { label: "View your booking", href: `${siteUrl()}/dashboard/bookings` },
      outro: "Questions about this trip? Just reply to this email and our team will pick it up.",
    }
  );
}

export function newBookingToVendor(input: {
  reference: string;
  what: string;
  dates: string;
  travelerName: string;
  total: string;
}): RenderedEmail {
  return render(`New booking — ${input.dates}`, {
    heading: "You have a new booking",
    intro: `${input.travelerName} has booked ${input.what}. Please confirm or decline it from your dashboard.`,
    rows: [
      { label: "Booking reference", value: input.reference },
      { label: "Traveler", value: input.travelerName },
      { label: "What", value: input.what },
      { label: "Dates", value: input.dates },
      { label: "Booking value", value: input.total },
    ],
    cta: { label: "Open your dashboard", href: `${siteUrl()}/dashboard` },
  });
}

export function newBookingToAgency(input: {
  reference: string;
  type: string;
  what: string;
  dates: string;
  travelerName: string;
  travelerEmail: string;
  total: string;
  status: string;
}): RenderedEmail {
  return render(`[Booking] ${input.type} — ${input.travelerName}`, {
    heading: "New booking on the site",
    intro: `${input.travelerName} just booked ${input.what}.`,
    rows: [
      { label: "Booking reference", value: input.reference },
      { label: "Type", value: input.type },
      { label: "What", value: input.what },
      { label: "Dates", value: input.dates },
      { label: "Traveler", value: `${input.travelerName} (${input.travelerEmail})` },
      { label: "Total", value: input.total },
      { label: "Status", value: input.status },
    ],
    cta: { label: "Open admin bookings", href: `${siteUrl()}/chim/bookings` },
  });
}

export function bookingStatusToTraveler(input: {
  travelerName: string;
  reference: string;
  what: string;
  dates: string;
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED";
}): RenderedEmail {
  const copy = {
    CONFIRMED: {
      subject: `Confirmed — ${input.what}`,
      heading: "Your booking is confirmed",
      intro: "Good news — everything is locked in for your trip. Details are below.",
      outro: "Need to change anything? Reply to this email and we'll sort it out.",
    },
    CANCELLED: {
      subject: `Cancelled — ${input.what}`,
      heading: "Your booking has been cancelled",
      intro: "This booking is now cancelled. If this wasn't expected, reply to this email and we'll look into it right away.",
      outro: "Any refund due will follow our cancellation policy and be processed separately.",
    },
    COMPLETED: {
      subject: `Trip complete — ${input.what}`,
      heading: "Thanks for travelling with us",
      intro: "Your trip is marked complete. We'd love to hear how it went — a review helps other travelers and helps our guides and hotels.",
      outro: "Kadrinchhey la — thank you, and we hope to see you in Bhutan again.",
    },
  }[input.status];

  return render(copy.subject, {
    heading: copy.heading,
    intro: copy.intro,
    rows: [
      { label: "Booking reference", value: input.reference },
      { label: "What", value: input.what },
      { label: "Dates", value: input.dates },
      { label: "Status", value: input.status.charAt(0) + input.status.slice(1).toLowerCase() },
    ],
    cta: { label: "View your booking", href: `${siteUrl()}/dashboard/bookings` },
    outro: copy.outro,
  });
}

export function bookingCancelledToVendor(input: {
  reference: string;
  what: string;
  dates: string;
  travelerName: string;
}): RenderedEmail {
  return render(`Cancelled — ${input.dates}`, {
    heading: "A booking has been cancelled",
    intro: `${input.travelerName}'s booking for ${input.what} has been cancelled. These dates are free again.`,
    rows: [
      { label: "Booking reference", value: input.reference },
      { label: "Traveler", value: input.travelerName },
      { label: "What", value: input.what },
      { label: "Dates", value: input.dates },
    ],
    cta: { label: "Open your dashboard", href: `${siteUrl()}/dashboard` },
  });
}

// ---------------------------------------------------------------------------
// Custom tour enquiries
// ---------------------------------------------------------------------------

export function customTourReceivedToTraveler(input: {
  travelerName: string;
  destinations: string;
  dates: string;
  travelers: number;
  estimate: string | null;
}): RenderedEmail {
  return render("We've received your custom tour request", {
    heading: `Thanks, ${input.travelerName.split(" ")[0]} — we're on it`,
    intro:
      "Our team will put together a tailored itinerary and get back to you, usually within one working day.",
    rows: [
      { label: "Destinations", value: input.destinations },
      { label: "Dates", value: input.dates },
      { label: "Travelers", value: String(input.travelers) },
      ...(input.estimate ? [{ label: "Indicative estimate", value: input.estimate }] : []),
    ],
    outro: input.estimate
      ? "That estimate is based on the guide, hotel and vehicle you picked — your final quote may differ once we confirm availability."
      : "Reply to this email any time if you'd like to add details about what you're hoping to see.",
  });
}

export function customTourToAgency(input: {
  travelerName: string;
  travelerEmail: string;
  destinations: string;
  dates: string;
  travelers: number;
  budget: string | null;
  estimate: string | null;
  notes: string | null;
}): RenderedEmail {
  return render(`[Enquiry] Custom tour — ${input.travelerName}`, {
    heading: "New custom tour request",
    intro: `${input.travelerName} submitted a custom tour request.`,
    rows: [
      { label: "Traveler", value: `${input.travelerName} (${input.travelerEmail})` },
      { label: "Destinations", value: input.destinations },
      { label: "Dates", value: input.dates },
      { label: "Travelers", value: String(input.travelers) },
      ...(input.budget ? [{ label: "Budget", value: input.budget }] : []),
      ...(input.estimate ? [{ label: "System estimate", value: input.estimate }] : []),
      ...(input.notes ? [{ label: "Notes", value: input.notes }] : []),
    ],
    cta: { label: "Open custom tour requests", href: `${siteUrl()}/chim/custom-tours` },
  });
}

// ---------------------------------------------------------------------------
// Contact / general enquiries (no account required)
// ---------------------------------------------------------------------------

export function contactReceivedToSender(input: {
  name: string;
  subject: string | null;
  message: string;
}): RenderedEmail {
  return render("We've got your message", {
    heading: `Thanks, ${input.name.split(" ")[0]} — message received`,
    intro:
      "One of our team will get back to you, usually within one working day. Here's a copy of what you sent.",
    rows: [
      ...(input.subject ? [{ label: "Subject", value: input.subject }] : []),
      { label: "Your message", value: input.message },
    ],
    outro: "You can reply directly to this email if you'd like to add anything.",
  });
}

export function contactToAgency(input: {
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  accountNote: string;
}): RenderedEmail {
  return render(`[Contact] ${input.subject || input.name}`, {
    heading: "New enquiry from the website",
    intro: `${input.name} sent a message through the contact form.`,
    rows: [
      { label: "From", value: `${input.name} (${input.email})` },
      ...(input.phone ? [{ label: "Phone", value: input.phone }] : []),
      ...(input.subject ? [{ label: "Subject", value: input.subject }] : []),
      { label: "Message", value: input.message },
      { label: "Account", value: input.accountNote },
    ],
    cta: { label: "Open enquiries", href: `${siteUrl()}/chim/enquiries` },
    outro: "Reply to this email to answer them directly.",
  });
}

/**
 * A visitor asked for a trip's itinerary. It goes to the agency, not the
 * visitor: staff send the itinerary themselves, so this carries everything
 * they need to do that — who asked, for which trip and date, and the PDF.
 */
export function itineraryRequestToAgency(input: {
  customerEmail: string;
  tripTitle: string;
  departure: string | null;
  pdfUrl: string;
  tripUrl: string;
}): RenderedEmail {
  return render(`[Itinerary request] ${input.tripTitle} — ${input.customerEmail}`, {
    heading: "Itinerary requested from the website",
    intro: `${input.customerEmail} asked for the itinerary for ${input.tripTitle}. They have been told our team will email it to them, usually within one working day.`,
    rows: [
      { label: "Customer email", value: input.customerEmail },
      { label: "Trip", value: input.tripTitle },
      { label: "Departure", value: input.departure ?? "Not chosen yet" },
      { label: "Itinerary PDF", value: input.pdfUrl },
      { label: "Trip page", value: input.tripUrl },
    ],
    cta: { label: "Download the itinerary PDF", href: input.pdfUrl },
    outro:
      "Reply to this email and your reply goes straight to the customer — attach the PDF, or paste the link above.",
  });
}

// ---------------------------------------------------------------------------
// Vendor approvals
// ---------------------------------------------------------------------------

/**
 * A guide's application arrived. Two emails: a receipt to the applicant that
 * says plainly what happens next (no account yet), and an alert to the agency.
 */
export function guideApplicationReceived(input: { name: string }): RenderedEmail {
  return render("We've received your guide application", {
    heading: "Application received",
    intro: `Thank you, ${input.name}. Our team will review your application and your TCB licence details, and email you with a decision.`,
    outro:
      "You don't need to do anything else for now. No account is created at this stage — if your application is approved, we'll email you a link to set your password and log in.",
  });
}

export function guideApplicationToAgency(input: {
  name: string;
  email: string;
  phone: string;
  licenseNumber: string;
  languages: string[];
  ratePerDay: string;
}): RenderedEmail {
  return render(`[Guide application] ${input.name}`, {
    heading: "New tour guide application",
    intro: `${input.name} applied to join as a tour guide. Nothing is public and no login exists until you approve it.`,
    rows: [
      { label: "Name", value: input.name },
      { label: "Email", value: input.email },
      { label: "Phone / WhatsApp", value: input.phone },
      { label: "TCB licence", value: input.licenseNumber },
      { label: "Languages", value: input.languages.join(", ") },
      { label: "Rate per day", value: `Nu. ${input.ratePerDay}` },
    ],
    cta: { label: "Review the application", href: `${siteUrl()}/chim/vendors` },
    outro: "Approving it emails the guide a link to set their password. Rejecting it sends them a note and creates nothing.",
  });
}

/** A fresh "set your password" link, sent on request from the admin panel. */
export function loginLinkToVendor(input: { name: string; url: string; days: number }): RenderedEmail {
  return render("Set your password to log in", {
    heading: "Set your password",
    intro: `Hello ${input.name}, use the button below to choose a password and log in to your dashboard.`,
    cta: { label: "Set your password", href: input.url },
    outro: `The link works once and expires in ${input.days} days. If it has expired, reply to this email and we'll send a new one.`,
  });
}

export function vendorStatusToVendor(input: {
  listingName: string;
  status: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING";
  adminNote: string | null;
  /** For an approved applicant with no login yet: the link to create one. */
  loginLink?: { url: string; days: number };
}): RenderedEmail {
  const copy = {
    APPROVED: {
      subject: `Approved — ${input.listingName} is live`,
      heading: "Your listing has been approved",
      intro: `${input.listingName} is now live on Droelma Tours & Travels and can receive bookings.`,
      outro: "Keep your availability and rates up to date from your dashboard so travelers see the right information.",
    },
    REJECTED: {
      subject: `Update on your application — ${input.listingName}`,
      heading: "We couldn't approve your listing yet",
      intro: `We've reviewed ${input.listingName} and can't approve it as it stands.`,
      outro: "You're welcome to update your details and reapply — reply to this email if you'd like help.",
    },
    SUSPENDED: {
      subject: `Suspended — ${input.listingName}`,
      heading: "Your listing has been suspended",
      intro: `${input.listingName} has been temporarily suspended and won't appear in search results or accept new bookings.`,
      outro: "Reply to this email to discuss reinstating it.",
    },
    PENDING: {
      subject: `Back under review — ${input.listingName}`,
      heading: "Your listing is under review again",
      intro: `${input.listingName} has been moved back to pending review. We'll be in touch once it's been looked at.`,
      outro: "",
    },
  }[input.status];

  return render(copy.subject, {
    heading: copy.heading,
    intro: copy.intro,
    rows: [
      { label: "Listing", value: input.listingName },
      { label: "Status", value: input.status.charAt(0) + input.status.slice(1).toLowerCase() },
      ...(input.adminNote ? [{ label: "Note from our team", value: input.adminNote }] : []),
    ],
    // An applicant who has no login yet is given the way to make one;
    // everyone else goes to the dashboard they already use.
    ...(input.loginLink && input.status === "APPROVED"
      ? {
          cta: { label: "Set your password and log in", href: input.loginLink.url },
          outro: `You don't have a login yet — the button above lets you choose a password. The link works once and expires in ${input.loginLink.days} days; if it has expired, reply to this email and we'll send a new one.`,
        }
      : {
          cta: { label: "Open your dashboard", href: `${siteUrl()}/dashboard` },
          outro: copy.outro || undefined,
        }),
  });
}

// ---------------------------------------------------------------------------
// A personal reply to an enquiry, written by the team
// ---------------------------------------------------------------------------

/**
 * Looks like a letter, not a notification: the team's own words, a signature,
 * and the traveller's original message quoted underneath so the thread makes
 * sense in their inbox.
 */
export function enquiryReplyToSender(input: {
  subject: string;
  body: string;
  signedBy: string;
  originalMessage: string;
  originalDate: Date;
}): RenderedEmail {
  const paragraphs = input.body
    .split(/\n{2,}/)
    .map(
      (p) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.65;color:${INK};">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`
    )
    .join("");
  const quoted = `On ${formatDate(input.originalDate)} you wrote:`;
  const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f4f1;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f4f1;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid ${BORDER};border-radius:10px;">
        <tr><td style="padding:28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          ${paragraphs}
          <p style="margin:22px 0 0;font-size:15px;line-height:1.6;color:${INK};">Warm regards,<br><strong>${escapeHtml(input.signedBy)}</strong><br><span style="color:${MUTED};">${BRAND}</span></p>
        </td></tr>
        <tr><td style="padding:16px 28px 22px;border-top:1px solid ${BORDER};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
          <p style="margin:0 0 6px;font-size:12px;color:${MUTED};">${escapeHtml(quoted)}</p>
          <p style="margin:0;font-size:13px;line-height:1.55;color:${MUTED};border-left:3px solid ${BORDER};padding-left:10px;">${escapeHtml(input.originalMessage).replace(/\n/g, "<br>")}</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const text = [
    input.body,
    "",
    "Warm regards,",
    input.signedBy,
    BRAND,
    "",
    "—",
    quoted,
    ...input.originalMessage.split("\n").map((l) => `> ${l}`),
  ].join("\n");
  return { subject: input.subject, html, text };
}
