import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client";

const SESSION_COOKIE = "dtt_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 14; // 14 days

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is not set");
  }
  return new TextEncoder().encode(secret);
}

/** What goes into a session token. */
export type SessionPayload = {
  userId: string;
  role: Role;
};

/** What comes back out of one. `issuedAt` is jose's `iat`, in seconds since
 * the epoch, and is set when the token is signed rather than by the caller —
 * which is what lets getCurrentUser refuse tokens minted before the account's
 * password changed. */
export type Session = SessionPayload & { issuedAt: number };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSessionCookie(payload: SessionPayload) {
  const token = await new SignJWT({ role: payload.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    if (!payload.sub || !payload.role || typeof payload.iat !== "number") return null;
    return { userId: payload.sub, role: payload.role as Role, issuedAt: payload.iat };
  } catch {
    return null;
  }
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) return null;

  if (isSessionStale(session.issuedAt, user.passwordChangedAt)) return null;

  return user;
}

/**
 * Whether a token predates the account's current password.
 *
 * A session minted before the password changed is no longer a session. There
 * is no server-side store to delete from — the cookie is a signed JWT good for
 * fourteen days — so changing a password would otherwise leave whoever knew
 * the old one signed in until it expired. That matters most for exactly the
 * case this was written for: an admin account whose password was a published
 * default.
 *
 * `iat` has one-second resolution and is rounded down, so a token minted in
 * the same second as the change can read as older than it. The second of slack
 * keeps the person doing the changing signed in; it cannot save an older
 * session, which is further out than that either way.
 *
 * Its own function so it can be tested without a database or a cookie jar.
 */
export function isSessionStale(issuedAt: number, passwordChangedAt: Date | null): boolean {
  if (!passwordChangedAt) return false;
  return issuedAt + 1 < Math.floor(passwordChangedAt.getTime() / 1000);
}

export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new AuthError("Not authenticated");
  return user;
}

export async function requireRole(...roles: Role[]) {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError("Not authorized");
  }
  return user;
}

export class AuthError extends Error {}
