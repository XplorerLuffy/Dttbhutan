import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { agencyInbox, sendEmail, type EmailAttachment } from "@/lib/email/send";
import { enquiryReplyToSender, type ReplyQuote } from "@/lib/email/templates";
import { getCompany } from "@/lib/content";
import { absoluteUrl } from "@/lib/seo";

/** A request body over about 4.5 MB is refused by Vercel before this code runs,
 * so the files a person adds by hand have to fit under it together. */
const MAX_FILES = 5;
const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

const textSchema = z.object({
  subject: z.string().trim().min(1, "Add a subject").max(200),
  body: z.string().trim().min(1, "Write your reply").max(10_000),
});

const quoteSchema = z.object({
  label: z.string().trim().min(1, "Say what the price is for").max(200),
  amount: z.coerce.number().positive("Enter the price").max(100_000_000),
  basis: z.enum(["PER_PERSON", "TOTAL"]),
  travelers: z.coerce.number().int().min(1).max(200).optional().nullable(),
  validUntil: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
    .optional()
    .nullable(),
  note: z.string().trim().max(1000).optional().nullable(),
});

const fail = (error: string, status = 400) => NextResponse.json({ error }, { status });

/**
 * Emails a reply to the person who sent an enquiry, on the company letterhead,
 * optionally with a price quotation, the itinerary PDF of a package, and files.
 *
 * The reply is stored whether or not the email goes out, so the team's words
 * are never lost to a mail-server hiccup — but the response says plainly when
 * it did not go, so nobody believes a customer was answered when they weren't.
 * Replies to it land in the agency inbox (AGENCY_NOTIFICATION_EMAIL).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await params;

    const form = await req.formData().catch(() => null);
    if (!form) return fail("The reply couldn't be read. If you attached files, they may be too large.");

    const text = textSchema.safeParse({ subject: form.get("subject"), body: form.get("body") });
    if (!text.success) return fail(text.error.issues[0]?.message ?? "Check the reply and try again");

    // --- price -----------------------------------------------------------
    let quote: ReplyQuote | null = null;
    const quoteRaw = form.get("quote");
    if (typeof quoteRaw === "string" && quoteRaw.trim()) {
      let parsedJson: unknown;
      try {
        parsedJson = JSON.parse(quoteRaw);
      } catch {
        return fail("The price details couldn't be read");
      }
      const q = quoteSchema.safeParse(parsedJson);
      if (!q.success) return fail(q.error.issues[0]?.message ?? "Check the price details");
      quote = {
        ...q.data,
        travelers: q.data.basis === "PER_PERSON" ? q.data.travelers ?? null : null,
        validUntil: q.data.validUntil || null,
        note: q.data.note || null,
      };
    }

    // --- attachments -----------------------------------------------------
    const attachments: EmailAttachment[] = [];
    const files = form.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
    if (files.length > MAX_FILES) return fail(`Attach at most ${MAX_FILES} files`);
    let total = 0;
    for (const file of files) {
      total += file.size;
      if (!ALLOWED_TYPES.has(file.type)) {
        return fail(`"${file.name}" isn't a type we can send. Use PDF, Word, Excel, images or text.`);
      }
      attachments.push({
        filename: file.name.replace(/[^\w.\- ()]+/g, "_").slice(0, 120) || "attachment",
        content: Buffer.from(await file.arrayBuffer()),
        contentType: file.type,
      });
    }
    if (total > MAX_TOTAL_BYTES) {
      return fail("The files are too large — keep them under 4 MB in total. The package itinerary PDF doesn't count; add it with the package option.");
    }

    const itinerarySlug = form.get("itinerarySlug");
    if (typeof itinerarySlug === "string" && itinerarySlug) {
      const pkg = await prisma.itinerary.findFirst({
        where: { slug: itinerarySlug, status: "PUBLISHED" },
        select: { title: true, slug: true },
      });
      if (!pkg) return fail("That package wasn't found");
      const res = await fetch(absoluteUrl(`/packages/${pkg.slug}/itinerary.pdf`), {
        cache: "no-store",
        signal: AbortSignal.timeout(20_000),
      }).catch(() => null);
      if (!res || !res.ok) {
        return fail(`The itinerary PDF for "${pkg.title}" couldn't be prepared just now. Try again in a moment.`, 502);
      }
      attachments.push({
        filename: `${pkg.title.replace(/[^\w\- ]+/g, "").trim().replace(/\s+/g, "-")}-itinerary.pdf`,
        content: Buffer.from(await res.arrayBuffer()),
        contentType: "application/pdf",
      });
    }

    const enquiry = await prisma.contactMessage.findUnique({ where: { id } });
    if (!enquiry) return fail("Enquiry not found", 404);

    // --- send ------------------------------------------------------------
    const company = await getCompany();
    const email = enquiryReplyToSender({
      subject: text.data.subject,
      body: text.data.body,
      signedBy: "Chimi",
      originalMessage: enquiry.message,
      originalDate: enquiry.createdAt,
      quote,
      attachmentNames: attachments.map((a) => a.filename),
      contact: { phone: company.phone || undefined, email: company.email || undefined },
    });
    const result = await sendEmail({
      to: enquiry.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: agencyInbox() ?? undefined,
      attachments,
    });

    const delivered = result.ok && !("skipped" in result);
    const error = !result.ok
      ? result.error
      : "skipped" in result
        ? "Email isn't set up on this site yet (SMTP_USER / SMTP_PASS or RESEND_API_KEY)."
        : null;

    const reply = await prisma.contactReply.create({
      data: {
        messageId: enquiry.id,
        subject: text.data.subject,
        body: text.data.body,
        toEmail: enquiry.email,
        sentById: admin.id,
        status: delivered ? "SENT" : "FAILED",
        error,
        quote: quote ?? undefined,
        attachments: attachments.length
          ? attachments.map((a) => ({ name: a.filename, bytes: a.content.length }))
          : undefined,
      },
    });

    // Answering it means it is no longer new.
    if (delivered && enquiry.status === "NEW") {
      await prisma.contactMessage.update({ where: { id: enquiry.id }, data: { status: "IN_PROGRESS" } });
    }

    if (!delivered) {
      return NextResponse.json(
        { error: `The email wasn't sent. ${error ?? ""}`.trim(), replyId: reply.id },
        { status: 502 }
      );
    }
    return NextResponse.json({ ok: true, replyId: reply.id });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
