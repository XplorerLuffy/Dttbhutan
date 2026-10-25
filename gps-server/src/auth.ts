import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * The authentication code a device must present in 0x0102. It is derived, not
 * stored: HMAC-SHA256 of the device's phone number under a server-only secret,
 * so there is no code table to leak, a code issued for one device is useless
 * for any other, and rotating the secret revokes every code at once.
 */
export function authCodeFor(secret: string, phone: string): string {
  return createHmac("sha256", secret).update(`jt808:${phone}`).digest("hex").slice(0, 16).toUpperCase();
}

export function authCodeMatches(secret: string, phone: string, presented: string): boolean {
  const a = Buffer.from(authCodeFor(secret, phone));
  const b = Buffer.from(presented);
  return a.length === b.length && timingSafeEqual(a, b);
}
