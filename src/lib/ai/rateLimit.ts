import "server-only";

/**
 * Per-IP rate limiting for /api/chat, same in-memory sliding-window
 * technique as /api/contact (src/app/api/contact/route.ts) — kept as a
 * separate instance rather than a shared import so this endpoint's much
 * lower ceiling can't accidentally get relaxed by a future change made for
 * the contact form, or vice versa.
 *
 * Deliberately not a shared external service (Redis, etc.) for the same
 * reason the contact form doesn't use one: nothing in this project runs
 * one yet, and one in-memory Map is honest about its limits (doesn't
 * survive a restart, isn't shared across serverless instances) without
 * adding new infrastructure for a v1. Move to a shared store if this
 * endpoint attracts real abuse.
 *
 * The limit here is tighter than the contact form's per unit time: a
 * contact submission is a single one-off action, but every chat message is
 * a paid LLM call, so the cost of unchecked traffic is far higher per
 * request.
 */

const RATE_LIMIT = { windowMs: 60 * 1000, max: 8 } as const;
const submissions = new Map<string, number[]>();

export function isChatRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (submissions.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);

  if (recent.length >= RATE_LIMIT.max) {
    submissions.set(key, recent);
    return true;
  }

  recent.push(now);
  submissions.set(key, recent);

  if (submissions.size > 5000) {
    submissions.forEach((times, k) => {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) submissions.delete(k);
    });
  }

  return false;
}

/** Exposed for tests only — lets a test reset state between scenarios
 * without reaching into the module's private Map. */
export function _resetChatRateLimitForTests(): void {
  submissions.clear();
}
