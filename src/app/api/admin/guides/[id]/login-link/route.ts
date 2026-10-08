import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canInvite, issueInvite } from "@/lib/invite";
import { notifyLoginLink } from "@/lib/email/notify";
import { isPlaceholderEmail } from "@/lib/adminVendor";

/**
 * A fresh "set your password" link for an approved guide who has no login yet.
 *
 * Makes a new link (replacing any earlier one) and returns it, so the admin
 * can paste it into WhatsApp as easily as email — many guides live there, and
 * email may not be set up yet. With `send: true` it is also emailed, and the
 * response says what really happened to that email.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = (await req.json().catch(() => null)) as { send?: boolean } | null;

    const guide = await prisma.guideProfile.findUnique({ where: { id }, include: { user: true } });
    if (!guide) return NextResponse.json({ error: "Guide not found." }, { status: 404 });

    if (guide.user.authId) {
      return NextResponse.json({ error: "This guide already has a login." }, { status: 409 });
    }
    if (guide.status !== "APPROVED") {
      return NextResponse.json(
        { error: "Approve the application first — a login is only given to approved guides." },
        { status: 409 }
      );
    }
    if (isPlaceholderEmail(guide.user.email) || !canInvite(guide.user)) {
      return NextResponse.json(
        { error: "There's no email address on file for this guide." },
        { status: 409 }
      );
    }

    const invite = await issueInvite(guide.user.id);
    const emailed = body?.send
      ? await notifyLoginLink({ email: guide.user.email, name: guide.user.name, url: invite.url })
      : null;

    return NextResponse.json({ url: invite.url, expiresAt: invite.expiresAt, emailed });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
