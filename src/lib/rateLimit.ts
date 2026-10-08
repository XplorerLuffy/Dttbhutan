import "server-only";
import type { NextRequest } from "next/server";

/**
 * A small in-memory limiter for public endpoints that anyone on the internet
 * can reach (the guide application, setting a password, anonymous photo
 * upload).
 *
 * Same caveats as the others in this project: the counts live in one server
 * instance's memory, so a restart clears them and several serverless
 * instances don't share them. It is a speed bump against someone hammering a
 * form, not a defence against a determined attacker.
 */
export function createRateLimiter({ windowMs, max }: { windowMs: number; max: number }) {
  const hits = new Map<string, number[]>();

  return function isLimited(key: string): boolean {
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      hits.set(key, recent);
      return true;
    }
    recent.push(now);
    hits.set(key, recent);

    // Don't let the map grow without bound.
    if (hits.size > 5000) {
      hits.forEach((times, k) => {
        if (times.every((t) => now - t >= windowMs)) hits.delete(k);
      });
    }
    return false;
  };
}

/** The caller's address as the platform reports it. */
export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown"
  );
}
