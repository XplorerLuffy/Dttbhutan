import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  asBrowserSessionCookie,
  encodeAdminSession,
  readAdminSession,
} from "@/lib/adminSession";
import {
  REALM_HEADER,
  isAuthCookieOf,
  realmForRequest,
  supabaseCookieOptions,
} from "@/lib/authRealm";

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
 * It also decides which of the two logins a request uses — the admin
 * dashboard's or the public site's, see authRealm.ts — and tells the rest of
 * the app through a header. Only that login's cookie is refreshed, so a visit
 * to the public site doesn't touch the admin's session, or the reverse. On
 * the admin side it keeps the session alive while the admin is active and ends
 * it once it has lapsed — see adminSession.ts.
 */
export async function middleware(request: NextRequest) {
  const realm = realmForRequest(
    request.nextUrl.pathname,
    request.headers.get("referer"),
    request.nextUrl.origin,
  );
  // Always set here, replacing anything the client sent.
  const forward = () => {
    const headers = new Headers(request.headers);
    headers.set(REALM_HEADER, realm);
    return NextResponse.next({ request: { headers } });
  };
  let response = forward();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  // Unconfigured (a developer who has not set the keys yet) must not take the
  // whole site down with a 500 on every route.
  if (!url || !key) return response;

  // Most visitors are not signed in. With no login cookie there is nothing to
  // refresh or verify, so skip the auth work (and its network calls) entirely.
  const hasLogin = request.cookies
    .getAll()
    .some(
      (c) =>
        c.name === ADMIN_SESSION_COOKIE ||
        isAuthCookieOf("admin", c.name) ||
        isAuthCookieOf("public", c.name),
    );
  if (!hasLogin) return response;

  const isAdmin = realm === "admin";
  const adminCookie = isAdmin
    ? request.cookies.get(ADMIN_SESSION_COOKIE)?.value
    : undefined;
  const now = Date.now();
  const adminSession = await readAdminSession(
    adminCookie,
    undefined,
    now,
  ).catch(() => null);

  const supabase = createServerClient(url, key, {
    ...supabaseCookieOptions(realm),
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(toSet) {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = forward();
        for (const { name, value, options } of toSet) {
          // The admin's sign-in stays a browser-session cookie when refreshed.
          response.cookies.set(
            name,
            value,
            isAdmin ? asBrowserSessionCookie(options) : options,
          );
        }
      },
    },
  });

  // getClaims() verifies the JWT locally against the project's published keys
  // and refreshes it when it is close to expiry. It is the call that makes the
  // cookie-writing above happen; without it the middleware is a no-op.
  const { data } = await supabase.auth.getClaims();

  const signedInAs = data?.claims?.sub;
  if (
    adminCookie &&
    (!adminSession || (signedInAs && adminSession.uid !== signedInAs))
  ) {
    // Lapsed, or left behind by a different sign-in: end the admin's session.
    // Only the admin's cookies — the public site's login is someone else's.
    response.cookies.set(ADMIN_SESSION_COOKIE, "", { path: "/", maxAge: 0 });
    for (const { name } of request.cookies.getAll()) {
      if (isAuthCookieOf("admin", name))
        response.cookies.set(name, "", { path: "/", maxAge: 0 });
    }
  } else if (
    adminSession &&
    now - adminSession.lastSeen > ADMIN_TOUCH_EVERY_MS
  ) {
    response.cookies.set(
      ADMIN_SESSION_COOKIE,
      await encodeAdminSession({ ...adminSession, lastSeen: now }),
      adminSessionCookieOptions,
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
