import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { agencyInbox, sendEmail } from "@/lib/email/send";
import { enquiryReplyToSender } from "@/lib/email/templates";

const replySchema = z.object({
  subject: z.string().trim().min(1, "Add a subject").max(200),
  body: z.string().trim().min(1, "Write your reply").max(10_000),
});

/**
 * Emails a reply to the person who sent an enquiry.
 *
 * The reply is stored whether or not the email goes out, so the team's words
 * are never lost to a mail-server hiccup — but the response says plainly when
 * it did not go, so nobody believes a customer was answered when they weren't.
 * Replies to it land in the agency inbox (AGENCY_NOTIFICATION_EMAIL).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const admin = await requireRole("ADMIN");
    const { id } = await params;

    const parsed = replySchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json(
        {
          error:
            parsed.error.issues[0]?.message ?? "Check the reply and try again",
        },
        { status: 400 },
      );
    }

    const enquiry = await prisma.contactMessage.findUnique({ where: { id } });
    if (!enquiry)
      return NextResponse.json({ error: "Enquiry not found" }, { status: 404 });

    const email = enquiryReplyToSender({
      subject: parsed.data.subject,
      body: parsed.data.body,
      signedBy: admin.name,
      originalMessage: enquiry.message,
      originalDate: enquiry.createdAt,
    });
    const result = await sendEmail({
      to: enquiry.email,
      subject: email.subject,
      html: email.html,
      text: email.text,
      replyTo: agencyInbox() ?? undefined,
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
        subject: parsed.data.subject,
        body: parsed.data.body,
        toEmail: enquiry.email,
        sentById: admin.id,
        status: delivered ? "SENT" : "FAILED",
        error,
      },
    });

    // Answering it means it is no longer new.
    if (delivered && enquiry.status === "NEW") {
      await prisma.contactMessage.update({
        where: { id: enquiry.id },
        data: { status: "IN_PROGRESS" },
      });
    }

    if (!delivered) {
      return NextResponse.json(
        {
          error: `The email wasn't sent. ${error ?? ""}`.trim(),
          replyId: reply.id,
        },
        { status: 502 },
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
