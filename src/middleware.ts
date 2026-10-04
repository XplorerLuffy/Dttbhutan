import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  asBrowserSessionCookie,
  encodeAdminSession,
  isSupabaseAuthCookie,
  readAdminSession,
} from "@/lib/adminSession";

/** Re-issue the admin cookie at most this often, not on every asset request. */
const ADMIN_TOUCH_EVERY_MS = 30 * 1000;

/**
 * Refreshes the Supabase session on every request.
 *
 * Access tokens are short-lived and the refresh has to happen somewhere that
 * can set cookies. A server component cannot, so without this the session
 * would expire mid-visit and a signed-in person would be bounced to the login
 * page for no reason they could see.
 *
 * It does not guard anything. Authorization stays where it was — each page
 * calls getCurrentUser() and checks the role itself — because that check needs
 * the profile row and its role, which lives in the application's own database
 * rather than in the token.
 *
 * It also keeps an admin's session alive while they use the site, and ends it
 * once it has lapsed — see adminSession.ts.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  // Unconfigured (a developer who has not set the keys yet) must not take the
  // whole site down with a 500 on every route.
  if (!url || !key) return response;

  const adminCookie = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;
  const now = Date.now();
  const adminSession = await readAdminSession(adminCookie, undefined, now).catch(() => null);

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) {
          // An admin's sign-in stays a browser-session cookie when refreshed.
          response.cookies.set(name, value, adminCookie ? asBrowserSessionCookie(options) : options);
        }
      },
    },
  });

  // getClaims() verifies the JWT locally against the project's published keys
  // and refreshes it when it is close to expiry. It is the call that makes the
  // cookie-writing above happen; without it the middleware is a no-op.
  const { data } = await supabase.auth.getClaims();

  const signedInAs = data?.claims?.sub;
  if (adminCookie && (!adminSession || (signedInAs && adminSession.uid !== signedInAs))) {
    // Lapsed, or left behind by a different sign-in: end the whole session,
    // so the admin isn't shown as logged in anywhere on the site.
    response.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    for (const { name } of request.cookies.getAll()) {
      if (isSupabaseAuthCookie(name)) response.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  } else if (adminSession && now - adminSession.lastSeen > ADMIN_TOUCH_EVERY_MS) {
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      await encodeAdminSession({ ...adminSession, lastSeen: now }),
      adminSessionCookieOptions
    );
  }

  return response;
}

export const config = {
  matcher: [
    // Everything except Next's own assets and image files — those never carry
    // a session and refreshing on each one would multiply the auth traffic.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|avif|ico|woff2?)$).*)",
  ],
};
