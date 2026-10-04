"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname } from "next/navigation";

const WARN_BEFORE_MS = 2 * 60 * 1000;
/** Tell the server about activity at most this often. */
const PING_EVERY_MS = 60 * 1000;
const TICK_MS = 15 * 1000;

/**
 * The browser's half of the admin session timeout (the server's is in
 * adminSession.ts and is what actually protects anything).
 *
 * The server only sees requests, so someone typing a long article without
 * saving would look idle to it. This tells it about that activity — at most
 * once a minute — and, once the session has run out, signs the screen out
 * itself rather than leaving bookings and customer details on display for
 * whoever sits down next. Two minutes before that it warns, with a button to
 * stay signed in.
 *
 * Its countdown runs from the last request it knows reached the server, the
 * same clock the server uses, so the two agree on when the session ends.
 */
export default function AdminSessionGuard({ idleMs }: { idleMs: number }) {
  const pathname = usePathname();
  const lastServerTouch = useRef(Date.now());
  const lastActivity = useRef(Date.now());
  const pinging = useRef(false);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);

  const expire = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    // The admin layout shows the sign-in form to a signed-out visitor, so
    // this lands on the login, and back on this page once signed in again.
    window.location.replace(`${window.location.pathname}?expired=1`);
  }, []);

  const ping = useCallback(async () => {
    if (pinging.current) return;
    pinging.current = true;
    try {
      const res = await fetch("/api/auth/session", { cache: "no-store" });
      if (res.status === 401) return void expire();
      if (res.ok) {
        lastServerTouch.current = Date.now();
        setSecondsLeft(null);
      }
    } catch {
      // Offline for a moment: the next tick tries again.
    } finally {
      pinging.current = false;
    }
  }, [expire]);

  // A page navigation is a request the server has seen.
  useEffect(() => {
    lastServerTouch.current = Date.now();
  }, [pathname]);

  useEffect(() => {
    const onActivity = () => {
      lastActivity.current = Date.now();
    };
    const onVisible = () => {
      // Back to a tab that may have outlived its session — check now rather
      // than at the next tick, which background tabs run late.
      if (document.visibilityState === "visible") void ping();
    };
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) void ping();
    };

    const activityEvents = ["pointerdown", "keydown", "wheel", "touchstart", "input"] as const;
    for (const name of activityEvents) window.addEventListener(name, onActivity, { passive: true });
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("pageshow", onPageShow);

    const tick = () => {
      const now = Date.now();
      const remaining = lastServerTouch.current + idleMs - now;
      if (remaining <= 0) return void expire();
      if (lastActivity.current > lastServerTouch.current && now - lastServerTouch.current >= PING_EVERY_MS) {
        void ping();
        return;
      }
      setSecondsLeft(remaining <= WARN_BEFORE_MS ? Math.ceil(remaining / 1000) : null);
    };
    const timer = window.setInterval(tick, TICK_MS);
    // Faster ticks while the warning is up, so its countdown moves.
    const fast = window.setInterval(() => {
      const remaining = lastServerTouch.current + idleMs - Date.now();
      if (remaining <= WARN_BEFORE_MS) tick();
    }, 1000);

    return () => {
      for (const name of activityEvents) window.removeEventListener(name, onActivity);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pageshow", onPageShow);
      window.clearInterval(timer);
      window.clearInterval(fast);
    };
  }, [idleMs, expire, ping]);

  if (secondsLeft === null) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = String(secondsLeft % 60).padStart(2, "0");

  // Portalled: a fixed element inside the page-transition wrapper (which
  // sets a transform) would be positioned against that wrapper instead.
  return createPortal(
    <div
      role="alertdialog"
      aria-live="assertive"
      aria-label="Session about to expire"
      className="fixed inset-x-4 bottom-4 z-[1000] mx-auto max-w-md rounded-lg border border-amber-300 bg-white p-4 shadow-xl"
    >
      <p className="font-semibold text-stone-900">Still there?</p>
      <p className="mt-1 text-sm text-stone-600">
        For security you&apos;ll be signed out in{" "}
        <span className="font-semibold tabular-nums">
          {minutes}:{seconds}
        </span>{" "}
        because the admin area has been idle.
      </p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => void ping()} className="btn-primary">
          Stay signed in
        </button>
        <button type="button" onClick={() => void expire()} className="btn-secondary">
          Sign out now
        </button>
      </div>
    </div>,
    document.body
  );
}
