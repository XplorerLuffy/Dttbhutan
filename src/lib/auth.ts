import "server-only";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";
import type { Role } from "@prisma/client";

/**
 * Who is signed in, and what they are allowed to do.
 *
 * Supabase Auth owns the credentials and the session; this file owns the
 * answer to "which of our users is that, and what is their role". The two are
 * joined by User.authId — see the comment on it in schema.prisma for why the
 * profile stayed in our own table rather than moving into auth.users.
 *
 * Roles deliberately live in the profile row rather than in the token's
 * app_metadata. A guide's role changes the moment an admin approves them, and
 * a role baked into a JWT stays wrong until that token is refreshed — up to an
 * hour of someone seeing the wrong dashboard. Reading it here costs nothing
 * extra, because every caller needs the profile row anyway.
 *
 * The call that matters is `getUser()`, not `getSession()`: getSession only
 * decodes the cookie, which anyone can write. getUser verifies the token.
 */
export type SessionPayload = {
  userId: string;
  role: Role;
};

export async function getCurrentUser() {
  // Unconfigured reads as "nobody is signed in" rather than throwing. Every
  // protected page then redirects to the login screen, which is a page that
  // explains itself; the alternative is a 500 on every dashboard in the site.
  // It fails closed either way — no configuration can grant access.
  if (!isSupabaseAuthConfigured()) return null;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();
  if (!authUser) return null;

  // No profile for a verified auth user means the two stores have drifted —
  // an account created directly in Supabase, or a profile deleted without its
  // auth user. Treat it as not signed in rather than inventing a role.
  return prisma.user.findUnique({ where: { authId: authUser.id } });
}

export async function getSession(): Promise<SessionPayload | null> {
  const user = await getCurrentUser();
  return user ? { userId: user.id, role: user.role } : null;
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

/**
 * Ends the current session.
 *
 * `scope: "global"` so signing out of one browser signs out of all of them,
 * which is what people expect of a "log out everywhere" and costs nothing
 * here.
 */
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: "global" });
}

export class AuthError extends Error {}
