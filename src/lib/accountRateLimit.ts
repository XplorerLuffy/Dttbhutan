import "server-only";

/**
 * Throttles attempts to change an account's own credentials.
 *
 * Same in-memory sliding window as /api/chat and /api/contact, and the same
 * caveats: it does not survive a restart and is not shared between serverless
 * instances. It is here to stop the current-password field being used as an
 * oracle to guess that password a few thousand times, which a limit this low
 * does even when the window resets — not to be a general abuse defence.
 *
 * Keyed by user id rather than IP, because the thing being guessed belongs to
 * an account, and anyone making the attempt already holds that account's
 * session cookie.
 */
const RATE_LIMIT = { windowMs: 60 * 1000, max: 5 } as const;
const attempts = new Map<string, number[]>();

export function isAccountChangeRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (attempts.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);

  if (recent.length >= RATE_LIMIT.max) {
    attempts.set(key, recent);
    return true;
  }

  recent.push(now);
  attempts.set(key, recent);

  if (attempts.size > 1000) {
    attempts.forEach((times, k) => {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) attempts.delete(k);
    });
  }

  return false;
}

/** Exposed for tests only. */
export function _resetAccountRateLimitForTests(): void {
  attempts.clear();
}
