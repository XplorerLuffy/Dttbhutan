/**
 * Where to go after logging in or signing up, taken from `?next=`.
 * Only a path on this site is accepted ("/packages/x?y=1#dates"); anything
 * that could lead elsewhere ("//evil.com", "https://…", "/\evil.com") is
 * ignored, so the login page cannot be turned into an open redirect.
 */
export function safeNextPath(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (!/^\/(?![/\\])/.test(raw)) return null;
  if (/[\u0000-\u001f]/.test(raw) || raw.length > 500) return null;
  return raw;
}
