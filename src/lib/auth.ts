import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  ADMIN_SESSION_COOKIE,
  explainAdminSessionRejection,
  readAdminSession,
} from "@/lib/adminSession";
import { isAuthCookieOf, type Realm } from "@/lib/authRealm";
import {
  createSupabaseServerClient,
  currentRealm,
  isSupabaseAuthConfigured,
} from "@/lib/supabase/server";
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

// Cached per request: the admin layout and its page both ask, and each ask
// is a round trip to Supabase that a burst of page loads multiplies.
export const getCurrentUser = cache(loadCurrentUser);

async function loadCurrentUser() {
  // Unconfigured reads as "nobody is signed in" rather than throwing. Every
  // protected page then redirects to the login screen, which is a page that
  // explains itself; the alternative is a 500 on every dashboard in the site.
  // It fails closed either way — no configuration can grant access.
  if (!isSupabaseAuthConfigured()) return null;

  // The admin dashboard and the public site keep separate logins (see
  // authRealm.ts), so "who is signed in" depends on which one this request is.
  const realm = await currentRealm();
  const supabase = await createSupabaseServerClient(realm);
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser();
  if (!authUser) {
    // Signed-out visitors carry no auth cookie and aren't worth a log line.
    // Someone who does carry one and is still refused is: that's a session
    // that looked live to the browser and wasn't to Supabase.
    if ((await cookies()).getAll().some((c) => isAuthCookieOf(realm, c.name) && c.value)) {
      console.warn(
        `[auth] ${realm} cookie refused by Supabase: ${error?.status ?? ""} ${error?.code ?? ""} ${error?.message ?? "no user"}`
      );
    }
    return null;
  }

  // No profile for a verified auth user means the two stores have drifted —
  // an account created directly in Supabase, or a profile deleted without its
  // auth user. Treat it as not signed in rather than inventing a role.
  const user = await prisma.user.findUnique({ where: { authId: authUser.id } });

  if (!user) return null;

  if (realm === "admin") {
    // The admin dashboard is for admins and nobody else, and needs a live
    // admin session on top of the login — see adminSession.ts.
    if (user.role !== "ADMIN") return null;
    const value = (await cookies()).get(ADMIN_SESSION_COOKIE)?.value;
    const session = await readAdminSession(value, authUser.id);
    if (!session) {
      console.warn(
        `[auth] admin ${user.email} treated as signed out: ${await explainAdminSessionRejection(value, authUser.id)}`
      );
      return null;
    }
    return user;
  }

  // The public site never recognises an admin, even one whose login cookie
  // ended up here: admins sign in on their own page, so the public pages (the
  // vendor sign-ups, the nav bar) never see the admin's session.
  if (user.role === "ADMIN") return null;
  return user;
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
export async function signOut(realm?: Realm) {
  const supabase = await createSupabaseServerClient(realm);
  await supabase.auth.signOut({ scope: "global" });
}

export class AuthError extends Error {}
