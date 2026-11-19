"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import LogoutButton from "@/components/LogoutButton";
import { greetingForHour, initialsOf } from "@/lib/greeting";

/**
 * The top of the customer dashboard: a scenic banner with a personal greeting,
 * a notifications bell and the account menu.
 *
 * The greeting follows the visitor's own clock. The page is rendered on the
 * server, which cannot know it, so it starts from `initialGreeting` (Bhutan
 * time) and the browser corrects it once the page is open.
 *
 * Notifications: the site has no notification system yet, only emails. The bell
 * is the interaction without a backend behind it: it shows a dot when
 * `unreadCount` is above zero (nothing passes one yet) and opens a panel that
 * says there is nothing new.
 *
 * The account menu lists what the traveler can reach today. "My Profile" and
 * "Account Settings" have no pages yet and are shown as coming soon rather
 * than linking nowhere.
 */
export default function WelcomeHeader({
  name,
  initialGreeting,
  imageUrl,
  avatarUrl,
  unreadCount = 0,
}: {
  name: string;
  initialGreeting: string;
  /** The banner photo. */
  imageUrl: string;
  /** A profile photo, when the account has one; otherwise initials. */
  avatarUrl?: string | null;
  unreadCount?: number;
}) {
  const firstName = name.trim().split(/\s+/)[0] || "traveler";
  const [greeting, setGreeting] = useState(initialGreeting);
  useEffect(() => {
    setGreeting(greetingForHour(new Date().getHours()));
  }, []);

  return (
    <header className="relative rounded-2xl bg-brand-950 shadow-sm">
      {/* The photo and its shade sit in their own clipped layer so the menus
          below, which hang past the banner's edge, are not cut off. */}
      <div className="absolute inset-0 overflow-hidden rounded-2xl" aria-hidden>
        <Image
          src={imageUrl}
          alt=""
          fill
          priority
          unoptimized
          sizes="(min-width: 1024px) 64rem, 100vw"
          className="object-cover object-[70%_40%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-brand-950/90 via-brand-950/55 to-brand-950/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-950/50 via-transparent to-transparent sm:from-transparent" />
      </div>

      <div className="absolute right-3 top-3 z-20 flex items-center gap-2 sm:right-5 sm:top-4 sm:gap-3">
        <NotificationBell unreadCount={unreadCount} />
        <AccountMenu name={name} avatarUrl={avatarUrl} />
      </div>

      {/* sm:pr-40 keeps a long name clear of the bell and avatar at the right. */}
      <div className="relative z-10 px-5 pb-6 pt-16 sm:py-9 sm:pl-8 sm:pr-40">
        <h1 className="max-w-xl text-white">
          <span className="block font-display text-xl font-medium text-white/95 sm:text-2xl">{greeting},</span>
          <span className="mt-0.5 flex items-baseline gap-2 font-display text-4xl font-bold leading-tight sm:text-5xl">
            <span className="min-w-0 truncate">{firstName}</span>
            <span aria-hidden className="shrink-0 text-3xl sm:text-4xl">
              👋
            </span>
          </span>
        </h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/90 sm:text-base">
          Welcome back to your DTT Bhutan travel portal.
          <br className="hidden sm:block" />{" "}
          Manage your bookings, prepare for your next trip, and explore new adventures.
        </p>
      </div>
    </header>
  );
}

/** Closes on Escape and on a click outside, and hands focus back to the button that opened it. */
function usePopover() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus = true) => {
    setOpen(false);
    if (returnFocus) buttonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) close(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  return { open, setOpen, close, wrapRef, buttonRef };
}

function NotificationBell({ unreadCount }: { unreadCount: number }) {
  const { open, setOpen, wrapRef, buttonRef } = usePopover();
  const panelId = useId();
  const label = unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications";

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9.5a6 6 0 1 1 12 0c0 4.5 1.8 5.8 2 6.5H4c.2-.7 2-2 2-6.5Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {unreadCount > 0 && (
          <span aria-hidden data-testid="unread-dot" className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-brand-950" />
        )}
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 top-full z-30 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-4 text-stone-800 shadow-xl ring-1 ring-stone-200"
        >
          <p className="text-sm font-bold text-brand-950">Notifications</p>
          <p className="mt-2 text-sm text-stone-600">You&apos;re all caught up. There&apos;s nothing new right now.</p>
        </div>
      )}
    </div>
  );
}

function AccountMenu({ name, avatarUrl }: { name: string; avatarUrl?: string | null }) {
  const { open, setOpen, close, wrapRef, buttonRef } = usePopover();
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const items = () =>
    Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([aria-disabled="true"])') ?? []);

  // Opening puts focus on the first item, as a menu should.
  useEffect(() => {
    if (open) items()[0]?.focus();
  }, [open]);

  function onMenuKey(e: React.KeyboardEvent) {
    const list = items();
    const i = list.indexOf(document.activeElement as HTMLElement);
    const move = (n: number) => {
      e.preventDefault();
      list[(n + list.length) % list.length]?.focus();
    };
    if (e.key === "ArrowDown") move(i + 1);
    else if (e.key === "ArrowUp") move(i - 1);
    else if (e.key === "Home") move(0);
    else if (e.key === "End") move(list.length - 1);
    else if (e.key === "Tab") close(false);
  }

  const row =
    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-800 transition-colors hover:bg-stone-100 focus-visible:bg-stone-100 focus-visible:outline-none";
  const soon = "flex w-full cursor-not-allowed items-center justify-between gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-stone-400";

  return (
    <div ref={wrapRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-label={`Account menu for ${name}`}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" && !open) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        className="flex items-center gap-1.5 rounded-full p-0.5 pr-2 text-white transition-colors hover:bg-white/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
      >
        {avatarUrl ? (
          <span className="relative h-10 w-10 overflow-hidden rounded-full ring-2 ring-white/70">
            <Image src={avatarUrl} alt="" fill unoptimized sizes="40px" className="object-cover" />
          </span>
        ) : (
          <span
            aria-hidden
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-brand-900 ring-2 ring-white/70"
          >
            {initialsOf(name)}
          </span>
        )}
        <svg aria-hidden viewBox="0 0 20 20" className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-60 max-w-[calc(100vw-2rem)] rounded-xl bg-white p-1.5 text-stone-800 shadow-xl ring-1 ring-stone-200">
          <p className="truncate px-3 pb-1.5 pt-2 text-xs font-semibold text-stone-500">{name}</p>
          <ul ref={menuRef} id={menuId} role="menu" aria-label="Account" onKeyDown={onMenuKey}>
            <li role="none">
              <span role="menuitem" aria-disabled="true" className={soon}>
                My Profile
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">Coming soon</span>
              </span>
            </li>
            <li role="none">
              <span role="menuitem" aria-disabled="true" className={soon}>
                Account Settings
                <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-semibold text-stone-500">Coming soon</span>
              </span>
            </li>
            <li role="none">
              <Link href="/dashboard" role="menuitem" onClick={() => close(false)} className={row}>
                My Trips
              </Link>
            </li>
            <li role="none" className="mt-1 border-t border-stone-100 pt-1">
              <LogoutButton role="menuitem" label="Sign Out" className={`${row} text-red-700 hover:bg-red-50 disabled:opacity-60`} />
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
