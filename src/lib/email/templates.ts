import "server-only";

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

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://dttbhutan.vercel.app").replace(/\/$/, "");
}

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
    cta: { label: "Open admin bookings", href: `${siteUrl()}/admin/bookings` },
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
    cta: { label: "Open custom tour requests", href: `${siteUrl()}/admin/custom-tours` },
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
    cta: { label: "Open enquiries", href: `${siteUrl()}/admin/enquiries` },
    outro: "Reply to this email to answer them directly.",
  });
}

// ---------------------------------------------------------------------------
// Vendor approvals
// ---------------------------------------------------------------------------

export function vendorStatusToVendor(input: {
  listingName: string;
  status: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING";
  adminNote: string | null;
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
    cta: { label: "Open your dashboard", href: `${siteUrl()}/dashboard` },
    outro: copy.outro || undefined,
  });
}
