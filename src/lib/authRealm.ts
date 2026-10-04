/**
 * Two separate logins in one browser: the public site's and the admin
 * dashboard's.
 *
 * Browser tabs share cookies, so with a single login, signing in as a guide
 * in one tab replaced the admin in every other tab — the dashboard kept
 * showing, and its next Save was refused as "not an admin". Each side now
 * keeps its own Supabase session in its own cookie:
 *
 *   public  sb-<project>-auth-token      travellers, guides, hotels, operators
 *   admin   dtt-admin-auth               the admin dashboard only
 *
 * A request uses the admin login when it is for an admin page, an admin API,
 * or an API call made from an admin page; everything else uses the public
 * one. Neither side reads the other's cookie, so an admin in one tab and a
 * guide in the next are simply two people.
 *
 * Shared by the middleware (Edge runtime) and server code, so no server-only
 * imports here.
 */

export type Realm = "admin" | "public";

/** Request header the middleware sets so server code knows which login applies.
 * Always overwritten there, so a client-supplied value is never trusted. */
export const REALM_HEADER = "x-dtt-realm";

/** Supabase storage key — and so cookie name — of the admin login. */
export const ADMIN_AUTH_COOKIE = "dtt-admin-auth";

const ADMIN_PAGES = /^\/chim(\/|$)/;

/**
 * Which login a request uses.
 *
 * API calls made from an admin page (photo uploads, booking actions) share
 * the page's login; the browser says which page made the call in `Referer`.
 * That only chooses which cookie to read: someone who fakes it still has to
 * hold the admin cookie, which is httpOnly and not sent cross-site.
 */
export function realmForRequest(pathname: string, referer: string | null, origin: string): Realm {
  if (ADMIN_PAGES.test(pathname)) return "admin";
  if (pathname.startsWith("/api/admin/") || pathname === "/api/auth/session") return "admin";
  if (pathname.startsWith("/api/") && referer) {
    try {
      const from = new URL(referer);
      if (from.origin === origin && ADMIN_PAGES.test(from.pathname)) return "admin";
    } catch {
      // An unreadable Referer is just not an admin page.
    }
  }
  return "public";
}

/** Options for createServerClient: the admin login lives under its own name. */
export function supabaseCookieOptions(realm: Realm) {
  return realm === "admin" ? { cookieOptions: { name: ADMIN_AUTH_COOKIE } } : {};
}

/** Whether `name` is a cookie of `realm`'s login (including .0, .1… chunks). */
export function isAuthCookieOf(realm: Realm, name: string): boolean {
  if (realm === "admin") return name === ADMIN_AUTH_COOKIE || name.startsWith(`${ADMIN_AUTH_COOKIE}.`);
  return name.startsWith("sb-") && name.includes("-auth-token");
}
