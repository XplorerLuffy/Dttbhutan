import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  AuthError,
  createSessionCookie,
  hashPassword,
  requireRole,
  verifyPassword,
} from "@/lib/auth";
import { adminAccountSchema } from "@/lib/validation";
import { isAccountChangeRateLimited } from "@/lib/accountRateLimit";

/**
 * Lets an admin change their own sign-in address and password.
 *
 * Only their own: there is no `userId` in the body and none is accepted, so
 * this cannot be turned into "an admin edits anyone's credentials" by a
 * crafted request. The account changed is always the one holding the session.
 *
 * The current password is required for both changes. Without it an unattended
 * logged-in browser is enough to move the account to an attacker's address and
 * then use the normal forgotten-password route from there.
 */
export async function PUT(req: NextRequest) {
  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  // Keyed by account, not by IP: this endpoint's risk is someone guessing the
  // current password of the session they are sitting in front of, and an IP
  // limit would be both evaded by a proxy and shared by a whole office.
  if (isAccountChangeRateLimited(admin.id)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;
  // Addresses are compared and stored lower-cased: the column is unique and
  // case-sensitive, so without this "Admin@…" and "admin@…" are two accounts
  // and whichever was typed at sign-up is the only one that can sign in.
  const email = parsed.data.email.trim().toLowerCase();

  if (!(await verifyPassword(currentPassword, admin.passwordHash))) {
    return NextResponse.json(
      { error: "That is not the current password." },
      { status: 403 }
    );
  }

  const emailChanged = email !== admin.email.toLowerCase();
  if (!emailChanged && !newPassword) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  const data: Prisma.UserUpdateInput = {};
  if (emailChanged) data.email = email;
  if (newPassword) {
    data.passwordHash = await hashPassword(newPassword);
    // Read by getCurrentUser to refuse sessions minted before this moment.
    data.passwordChangedAt = new Date();
  }

  try {
    await prisma.user.update({ where: { id: admin.id }, data });
  } catch (err) {
    // P2002 is the unique constraint on email: somebody already signs in with
    // that address. Saying so is not a disclosure an admin cannot already make
    // by looking at the users in their own dashboard.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Another account already uses that email address." },
        { status: 409 }
      );
    }
    throw err;
  }

  // A fresh cookie, so the admin who just changed their password is not logged
  // out by the check they just triggered. Everyone else holding a token for
  // this account is, which is the point.
  if (newPassword) {
    await createSessionCookie({ userId: admin.id, role: admin.role });
  }

  return NextResponse.json({
    email,
    emailChanged,
    passwordChanged: Boolean(newPassword),
  });
}
