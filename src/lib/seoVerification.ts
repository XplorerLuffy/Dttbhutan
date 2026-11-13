/**
 * Search engines give the verification code in several shapes, and people paste
 * whichever one they copied:
 *
 *   bHSgh…                                             the bare code (what the page tag needs)
 *   google-site-verification=bHSgh…                    the DNS TXT record form
 *   <meta name="google-site-verification" content="bHSgh…" />   the whole HTML tag
 *
 * The page tag's `content` must be the bare code only. A prefixed value makes
 * Google fail to match the tag, with no error on our side, so every form is
 * reduced to the bare code both when saving and when rendering the tag.
 */
export function verificationCode(raw: string): string {
  let v = raw.trim();
  const tag = /content\s*=\s*["']([^"']+)["']/i.exec(v);
  if (v.startsWith("<") && tag) v = tag[1].trim();
  v = v.replace(/^["'\s]+|["'\s]+$/g, "");
  v = v.replace(/^google-site-verification\s*=\s*/i, "");
  return v.trim();
}

/** Codes are letters, digits, hyphens and underscores. Anything else was a bad paste. */
export const isVerificationCode = (code: string) => /^[A-Za-z0-9_-]{10,128}$/.test(code);
