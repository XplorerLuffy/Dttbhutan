import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { isSupabaseAuthConfigured } from "@/lib/supabase/server";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  asBrowserSessionCookie,
  encodeAdminSession,
} from "@/lib/adminSession";
import { loginSchema } from "@/lib/validation";
import { migrateLegacyAccount } from "@/lib/authMigration";

/**
 * Signs in against Supabase Auth and hands back the role, which is what the
 * login page uses to decide which dashboard to open.
 *
 * Done here rather than from the browser so the response shape the login page
 * already expects is unchanged, and so the role comes from the profile row
 * rather than from anything the client could influence.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    // Says which half is missing rather than "Login failed", so a deploy with
    // the keys unset is diagnosable from the screen it fails on.
    return NextResponse.json(
      { error: "Sign-in is not configured on this deployment (Supabase keys are missing)." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();
  // Sent by the admin sign-in at /chim, which is for admins only.
  const adminOnly = Boolean((body as { adminOnly?: unknown }).adminOnly);

  // The session cookies Supabase wants to write are held back until we know
  // who signed in: an admin's are written without an expiry date, so they end
  // with the browser session (see adminSession.ts).
  const pendingCookies = new Map<string, { value: string; options: CookieOptions }>();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll(toSet) {
          for (const { name, value, options } of toSet) pendingCookies.set(name, { value, options });
        },
      },
    }
  );
  const respond = async (body: unknown, init: { status?: number; admin?: string } = {}) => {
    const res = NextResponse.json(body, { status: init.status ?? 200 });
    pendingCookies.forEach(({ value, options }, name) => {
      res.cookies.set(name, value, init.admin ? asBrowserSessionCookie(options) : options);
    });
    if (init.admin) {
      const now = Date.now();
      res.cookies.set(
        ADMIN_SESSION_COOKIE,
        await encodeAdminSession({ uid: init.admin, issuedAt: now, lastSeen: now }),
        adminSessionCookieOptions
      );
    } else {
      res.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    }
    return res;
  };

  let { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  // Supabase does not know this person yet — every account that predates the
  // switch to Supabase Auth. If the password matches the hash we already
  // hold, move the account over now and sign in. See authMigration.ts.
  if (error || !data.user) {
    const outcome = await migrateLegacyAccount(email, parsed.data.password);
    if (outcome === "migrated") {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email,
        password: parsed.data.password,
      }));
    }
  }

  // One message for a wrong password and for an address with no account:
  // telling them apart turns the form into a way to find out who has an
  // account here.
  if (error || !data.user) {
    return respond({ error: "Invalid email or password" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { authId: data.user.id } });
  if (!user) {
    // Credentials were right but there is no profile — the two stores have
    // drifted. Do not leave a usable session lying around for an account the
    // app cannot place.
    await supabase.auth.signOut();
    return respond(
      { error: "That account is not set up yet. Please contact the team." },
      { status: 403 }
    );
  }

  if (adminOnly && user.role !== "ADMIN") {
    // Undo the sign-in just made, on this browser only — not the account's
    // sessions on its owner's other devices.
    await supabase.auth.signOut({ scope: "local" });
    return respond({ error: "This sign-in is for administrators only." }, { status: 403 });
  }

  return respond(
    { id: user.id, role: user.role },
    { admin: user.role === "ADMIN" ? data.user.id : undefined }
  );
}
