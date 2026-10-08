import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { guideApplicationSchema } from "@/lib/validation";
import { notifyGuideApplication } from "@/lib/email/notify";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

/**
 * A tour guide applies to join — with no account and no password.
 *
 * Only an application is stored: a pending guide listing, held under a contact
 * record with no login. Nothing is public until an admin approves it, and the
 * login is created only then, when the guide follows the emailed link and
 * sets a password (see lib/invite.ts). Anyone turned down, or who was never a
 * real guide, leaves no login behind.
 *
 * Open to anyone on the internet, hence the honeypot, the per-address limit
 * and the length caps in the schema.
 */
const limited = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });

/** The same answer for every reason an email can't be used, so this form
 * can't be used to find out which addresses already have an account. */
const CANT_USE_EMAIL =
  "We can't take an application with this email address. If you've already applied, our team will be in touch — otherwise please use a different email.";

class EmailInUse extends Error {}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // Honeypot filled in: answer as a person would be answered, store nothing.
  if (body && typeof body === "object" && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true });
  }

  if (limited(clientIp(req))) {
    return NextResponse.json(
      { error: "Too many applications from this connection. Please try again later." },
      { status: 429 }
    );
  }

  const parsed = guideApplicationSchema.safeParse(body);
  if (!parsed.success) {
    // One plain sentence for the form to show, not zod's nested structure.
    const first = parsed.error.issues[0];
    return NextResponse.json(
      { error: first?.message ?? "Please check the form and try again." },
      { status: 400 }
    );
  }

  const { name, phone, destinationIds, photoUrl, bio, ...profile } = parsed.data;
  // Contact details and the honeypot belong to the user record, not the profile.
  const { email: rawEmail, website: _honeypot, ...listing } = profile;
  void _honeypot;
  const email = rawEmail.toLowerCase();

  // Only dzongkhags that exist are connected; a made-up id is ignored.
  const destinations = destinationIds.length
    ? await prisma.destination.findMany({ where: { id: { in: destinationIds } }, select: { id: true } })
    : [];

  try {
    const guide = await prisma.$transaction(async (tx) => {
      // Any existing account with this email — a traveller, a hotel, the
      // admin, another guide — blocks the application. It is never attached
      // to: that would give a stranger a listing on someone else's account.
      if (await tx.user.findUnique({ where: { email }, select: { id: true } })) {
        throw new EmailInUse();
      }
      const user = await tx.user.create({ data: { email, name, phone, role: "GUIDE" } });
      return tx.guideProfile.create({
        data: {
          userId: user.id,
          ...listing,
          bio: bio || null,
          photoUrl: photoUrl || null,
          // Every application starts PENDING and is checked by hand.
          status: "PENDING",
          destinations: { connect: destinations },
        },
        select: { id: true },
      });
    });

    await notifyGuideApplication(guide.id);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const raced = err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
    if (err instanceof EmailInUse || raced) {
      return NextResponse.json({ error: CANT_USE_EMAIL }, { status: 409 });
    }
    console.error("[guide application] failed", err);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 });
  }
}
