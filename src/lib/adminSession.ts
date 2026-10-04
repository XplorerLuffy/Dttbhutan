/**
 * The admin session: a second, short-lived proof of sign-in that admin
 * access requires on top of the Supabase session.
 *
 * Supabase keeps people signed in for months — its cookies last 400 days and
 * refresh themselves — which is right for a traveller or a guide on their own
 * phone, and wrong for the account that can see every booking and change the
 * site. So an admin also needs this cookie, which:
 *
 *  - is a browser-session cookie (no expiry date), so it is gone when the
 *    browser is closed;
 *  - stops counting after IDLE_MS without a request, which also covers
 *    browsers that restore session cookies when reopened ("continue where
 *    you left off" in Chrome and Edge); and
 *  - lasts MAX_MS at most however active the admin is.
 *
 * It is signed, so it can't be written by hand, and names the Supabase user
 * it was issued to, so it can't be carried over to another account.
 *
 * Runs in the middleware (Edge) as well as in Node, so it uses Web Crypto
 * only.
 */

export const ADMIN_SESSION_COOKIE = "dtt_admin_session";

/** Signed out after this long without any request to the site. */
export const ADMIN_IDLE_MS = 30 * 60 * 1000;
/** Signed out this long after signing in, active or not. */
export const ADMIN_MAX_MS = 12 * 60 * 60 * 1000;

export type AdminSession = { uid: string; issuedAt: number; lastSeen: number };

/** No maxAge or expires: the browser drops it when it closes. */
export const adminSessionCookieOptions = {
  path: "/",
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export async function encodeAdminSession(session: AdminSession): Promise<string> {
  const body = `${session.uid}.${session.issuedAt}.${session.lastSeen}`;
  return `${body}.${await sign(body)}`;
}

/** The session if the cookie is genuine, belongs to `uid` and is still live. */
export async function readAdminSession(
  value: string | undefined,
  uid?: string,
  now = Date.now()
): Promise<AdminSession | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 4) return null;
  const [cookieUid, issued, last, signature] = parts;
  if (!timingSafeEqual(signature, await sign(`${cookieUid}.${issued}.${last}`))) return null;

  const session = { uid: cookieUid, issuedAt: Number(issued), lastSeen: Number(last) };
  if (!Number.isFinite(session.issuedAt) || !Number.isFinite(session.lastSeen)) return null;
  if (uid !== undefined && session.uid !== uid) return null;
  if (now - session.lastSeen > ADMIN_IDLE_MS) return null;
  if (now - session.issuedAt > ADMIN_MAX_MS) return null;
  return session;
}

/**
 * Why a cookie was refused, for the server log — never shown to the visitor.
 * Mirrors readAdminSession's checks.
 */
export async function explainAdminSessionRejection(
  value: string | undefined,
  uid: string,
  now = Date.now()
): Promise<string> {
  if (!value) return "no admin session cookie";
  const parts = value.split(".");
  if (parts.length !== 4) return "malformed cookie";
  const [cookieUid, issued, last, signature] = parts;
  if (!timingSafeEqual(signature, await sign(`${cookieUid}.${issued}.${last}`))) {
    return "signature does not match (signing secret differs?)";
  }
  if (cookieUid !== uid) return "issued to a different user";
  if (now - Number(last) > ADMIN_IDLE_MS) {
    return `idle ${Math.round((now - Number(last)) / 60000)} min`;
  }
  if (now - Number(issued) > ADMIN_MAX_MS) return "older than the 12-hour maximum";
  return "unknown";
}

/** Supabase's auth cookies: sb-<project-ref>-auth-token, plus .0, .1… chunks. */
export function isSupabaseAuthCookie(name: string): boolean {
  return name.startsWith("sb-") && name.includes("-auth-token");
}

/**
 * Supabase's cookie options with the expiry removed, so the sign-in itself
 * also ends with the browser session. Clearing a cookie (maxAge 0) is left
 * alone — removing that would turn a deletion into a write.
 */
export function asBrowserSessionCookie<T extends { maxAge?: number; expires?: Date }>(
  options: T
): T {
  if (options.maxAge === 0) return options;
  const rest = { ...options };
  delete rest.maxAge;
  delete rest.expires;
  return rest;
}

let keyPromise: Promise<CryptoKey> | null = null;

function signingKey(): Promise<CryptoKey> {
  // A dedicated secret when one is set; otherwise one the deployment always
  // has and never exposes. The label keeps this key distinct from any other
  // use of the same value.
  const secret =
    process.env.ADMIN_SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (!secret) throw new Error("No secret available to sign admin sessions");
  keyPromise ??= crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(`dtt-admin-session:${secret}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  return keyPromise;
}

async function sign(body: string): Promise<string> {
  const mac = await crypto.subtle.sign("HMAC", await signingKey(), new TextEncoder().encode(body));
  const bytes = new Uint8Array(mac);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
