import "server-only";
import { createHash, randomBytes } from "node:crypto";
import type { User } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { absoluteUrl } from "@/lib/seo";
import { isPlaceholderEmail } from "@/lib/adminVendor";

/**
 * "Set your password" links for vendors an admin has accepted.
 *
 * Guides apply without an account. Only once an admin approves the
 * application is a login worth creating, and it is created when the guide
 * opens the emailed link and picks a password — not before. So applicants
 * who are turned down, or never come back, leave no login behind.
 *
 * The link carries a random token. Only its SHA-256 is stored, so reading the
 * database doesn't reveal a usable link, and it works once.
 */

export const INVITE_TTL_DAYS = 7;

export function hashInviteToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Whether this person could be sent a link: a real email and no login yet. */
export function canInvite(user: Pick<User, "authId" | "email" | "role">): boolean {
  return !user.authId && !isPlaceholderEmail(user.email) && user.role !== "ADMIN";
}

/** Makes a fresh link for `userId`, replacing any earlier one. */
export async function issueInvite(userId: string): Promise<{ url: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000);
  await prisma.user.update({
    where: { id: userId },
    data: { inviteTokenHash: hashInviteToken(token), inviteExpiresAt: expiresAt },
  });
  return { url: absoluteUrl(`/set-password?token=${token}`), expiresAt };
}

/** The person a link belongs to, or null if it is unknown, used or expired. */
export async function findInvite(token: string): Promise<User | null> {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const user = await prisma.user.findUnique({ where: { inviteTokenHash: hashInviteToken(token) } });
  if (!user || !user.inviteExpiresAt || user.inviteExpiresAt.getTime() < Date.now()) return null;
  return user;
}
