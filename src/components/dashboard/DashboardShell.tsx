"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { LogoLockup } from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

/**
 * The admin frame: a warm sidebar of grouped, icon-led links, a top bar with
 * search and the signed-in person, and the page beneath.
 *
 * On a phone the sidebar becomes a drawer behind a menu button. The drawer is
 * portalled to <body>: the page is wrapped in a transform for its fade-in,
 * and a `fixed` element inside a transformed parent is positioned against
 * that parent instead of the screen — which left the old drawer partly
 * unreachable.
 */
export type DashboardNavItem = {
  href: string;
  label: string;
  icon?: IconName;
  /** Heading this item sits under. */
  section?: string;
  /** Work waiting behind this link. Shown only when above zero: a badge that is
   * always there is one nobody reads. */
  badge?: number;
};

export type IconName =
  | "overview"
  | "bookings"
  | "enquiries"
  | "custom"
  | "vendors"
  | "gps"
  | "packages"
  | "destinations"
  | "guide"
  | "content"
  | "pages"
  | "knowledge"
  | "rates"
  | "account";

export default function DashboardShell({
  title,
  nav,
  realm,
  user,
  tagline,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  /** "admin" for the admin dashboard: Log out then ends only the admin's login. */
  realm?: "admin";
  user?: { name: string; email: string };
  tagline?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  // The link just clicked, highlighted at once. The server takes a moment to
  // answer; without this the sidebar looks like the click did nothing.
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  useEffect(() => setMounted(true), []);
  // A navigation closes the drawer.
  useEffect(() => {
    setOpen(false);
    setPendingHref(null);
  }, [pathname]);
  // Stop the page scrolling behind an open drawer.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const sections: { name: string | undefined; items: DashboardNavItem[] }[] = [];
  for (const item of nav) {
    const last = sections[sections.length - 1];
    if (last && last.name === item.section) last.items.push(item);
    else sections.push({ name: item.section, items: [item] });
  }

  const waiting = nav.reduce((sum, item) => sum + (item.badge ?? 0), 0);
  const isActive = (href: string) =>
    href === "/chim" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
  // The longest matching link wins, so "Page content" isn't also "Site content".
  const activeHref = nav
    .filter((n) => isActive(n.href))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const shownHref = pendingHref ?? activeHref;

  const navList = (
    <nav aria-label={`${title} navigation`} className="space-y-5">
      {sections.map((section, i) => (
        <div key={section.name ?? `s${i}`}>
          {section.name && (
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
              {section.name}
            </p>
          )}
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.href === shownHref;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => {
                      if (item.href !== activeHref) setPendingHref(item.href);
                      else setOpen(false);
                    }}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[15px] font-medium transition-colors ${
                      active
                        ? "bg-[#f3e3bd] text-brand-900 shadow-sm"
                        : "text-stone-700 hover:bg-white/70 hover:text-stone-900"
                    }`}
                  >
                    <NavIcon name={item.icon ?? "overview"} className={active ? "text-[#a8741a]" : "text-stone-500"} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge ? (
                      <span
                        className="shrink-0 rounded-full bg-brand-800 px-2 py-0.5 text-[11px] font-bold leading-none text-white"
                        aria-label={`${item.badge} waiting`}
                      >
                        {item.badge > 99 ? "99+" : item.badge}
                      </span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <Link href="/chim" aria-label="Admin home" className="block px-3">
      <LogoLockup className="h-auto w-44" />
    </Link>
  );

  return (
    <div className="admin-ui min-h-screen bg-[#fbf8f3] text-stone-900">
      {pendingHref && (
        <div
          role="progressbar"
          aria-label="Loading page"
          className="fixed inset-x-0 top-0 z-[60] h-1 overflow-hidden bg-[#f3e3bd]"
        >
          <div className="h-full w-1/3 animate-[admin-progress_1s_ease-in-out_infinite] rounded-full bg-brand-800" />
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-y-auto border-r border-stone-200/80 bg-[#fcf6e9] px-3 py-5 lg:flex">
        {brand}
        <div className="mt-6 flex-1">{navList}</div>
        {tagline && (
          <p className="mx-3 mt-6 border-t border-stone-200 pt-4 text-xs leading-relaxed text-stone-500">
            {tagline}
          </p>
        )}
      </aside>

      <div className="lg:pl-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-stone-200/80 bg-[#fbf8f3]/95 px-4 py-3 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            aria-expanded={open}
            className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 lg:hidden"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" strokeLinecap="round" />
            </svg>
            {waiting > 0 && (
              <span className="absolute -right-1 -top-1 rounded-full bg-brand-800 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                {waiting > 99 ? "99+" : waiting}
              </span>
            )}
          </button>

          <form action="/chim/bookings" method="get" role="search" className="min-w-0 flex-1 sm:max-w-xl">
            <label className="relative block">
              <span className="sr-only">Search bookings by reference, name or email</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" aria-hidden>
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" strokeLinecap="round" />
              </svg>
              <input
                name="q"
                type="search"
                placeholder="Search bookings, customers…"
                className="h-11 w-full rounded-xl border border-stone-200 bg-white pl-10 pr-3 text-sm placeholder:text-stone-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/20"
              />
            </label>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-3">
            {user && (
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold leading-tight text-stone-900">{user.name}</p>
                <p className="text-xs text-stone-500">Admin</p>
              </div>
            )}
            <span
              aria-hidden
              className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-900 text-sm font-semibold text-white"
            >
              {(user?.name ?? "A").trim().charAt(0).toUpperCase()}
            </span>
            <LogoutButton
              realm={realm}
              className="rounded-xl border border-stone-200 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50 disabled:opacity-50"
            />
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">{children}</div>
      </div>

      {/* Mobile drawer */}
      {mounted &&
        open &&
        createPortal(
          <div className="fixed inset-0 z-[60] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu">
            <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col overflow-y-auto bg-[#fcf6e9] px-3 py-5 shadow-xl">
              <div className="flex items-center justify-between">
                {brand}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close menu"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-stone-600 hover:bg-white/70"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5" aria-hidden>
                    <path d="m6 6 12 12M18 6 6 18" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
              <div className="mt-6 flex-1">{navList}</div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}

function NavIcon({ name, className = "" }: { name: IconName; className?: string }) {
  const paths: Record<IconName, React.ReactNode> = {
    overview: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
    bookings: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10h16M9 3v4M15 3v4" />
      </>
    ),
    enquiries: (
      <>
        <rect x="3" y="5" width="18" height="14" rx="2" />
        <path d="m3 7 9 6 9-6" />
      </>
    ),
    custom: (
      <>
        <path d="M4 20l4-1 11-11-3-3L5 16l-1 4Z" />
        <path d="m14 6 3 3" />
      </>
    ),
    vendors: (
      <>
        <circle cx="9" cy="8" r="3.2" />
        <path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" />
        <path d="m16 11 2 2 4-4" />
      </>
    ),
    gps: (
      <>
        <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
        <circle cx="12" cy="10" r="2.3" />
      </>
    ),
    packages: (
      <>
        <path d="M3 8l9-5 9 5-9 5-9-5Z" />
        <path d="M3 8v8l9 5 9-5V8M12 13v8" />
      </>
    ),
    destinations: (
      <>
        <path d="m3 19 6-11 4 7 2-3 6 7H3Z" />
      </>
    ),
    guide: (
      <>
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Z" />
        <path d="M8 8h7M8 12h7" />
      </>
    ),
    content: (
      <>
        <path d="M4 5h16M4 10h16M4 15h10M4 20h7" />
      </>
    ),
    pages: (
      <>
        <rect x="5" y="3" width="14" height="18" rx="2" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    knowledge: (
      <>
        <path d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2V17h5v-1.1c0-.8.4-1.5 1-2A6 6 0 0 0 12 3Z" />
        <path d="M10 21h4" />
      </>
    ),
    rates: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M14.5 9.2c-.4-.8-1.4-1.2-2.5-1.2-1.4 0-2.5.7-2.5 1.8 0 2.6 5 1.2 5 3.8 0 1.2-1.1 2-2.5 2-1.2 0-2.2-.5-2.7-1.4M12 6.5V8m0 8v1.5" />
      </>
    ),
    account: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.9 3.1-7 7-7s7 3.1 7 7" />
      </>
    ),
  };
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={`h-5 w-5 shrink-0 ${className}`}
    >
      {paths[name]}
    </svg>
  );
}
