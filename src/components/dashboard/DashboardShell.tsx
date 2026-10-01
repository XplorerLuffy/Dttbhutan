"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import LogoMark from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

/**
 * A persistent left-hand navigation shell for multi-page dashboards —
 * modeled on Booking.com's Partner Extranet, where every admin/vendor
 * screen lives behind the same sidebar rather than relying on the site's
 * top nav alone.
 */
export type DashboardNavItem = {
  href: string;
  label: string;
  /** Heading this item sits under. Items with no section come first, ungrouped,
   * which is what keeps the vendor dashboards' flat lists rendering as they
   * did before sections existed. */
  section?: string;
  /** Work waiting behind this link. Shown only when above zero: a badge that is
   * always there is one nobody reads. */
  badge?: number;
};

export default function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: DashboardNavItem[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const current = nav.find((item) => item.href === pathname);

  // Preserve the order the caller gave: sections appear where their first item
  // does, rather than alphabetically or by some fixed list here.
  const sections: { name: string | undefined; items: DashboardNavItem[] }[] = [];
  for (const item of nav) {
    const last = sections[sections.length - 1];
    if (last && last.name === item.section) last.items.push(item);
    else sections.push({ name: item.section, items: [item] });
  }

  const link = (item: DashboardNavItem) => {
    const active = pathname === item.href;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        onClick={() => setOpen(false)}
        className={`flex items-center justify-between gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
          active
            ? "bg-brand-50 text-brand-800"
            : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
        }`}
      >
        <span>{item.label}</span>
        {item.badge ? (
          <span
            className="shrink-0 rounded-full bg-brand-800 px-2 py-0.5 text-[11px] font-bold leading-none text-white"
            /* Spelled out for a screen reader, which otherwise reads a bare
               number with no idea what it counts. */
            aria-label={`${item.badge} waiting`}
          >
            {item.badge > 99 ? "99+" : item.badge}
          </span>
        ) : null}
      </Link>
    );
  };

  const waiting = nav.reduce((sum, item) => sum + (item.badge ?? 0), 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between border-b border-stone-200 pb-4">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark className="h-8 w-auto shrink-0" />
          <span className="hidden font-display text-sm font-semibold text-brand-800 sm:inline">
            Droelma Tours &amp; Travels
          </span>
        </Link>
        <LogoutButton />
      </div>

      {/* On a phone the whole list used to wrap into a block of chips taller
          than most of the pages it linked to. Collapsed behind the current
          page's name instead, so the screen opens on the content. */}
      <div className="mb-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-lg border border-stone-200 bg-white px-4 py-3 text-left"
        >
          <span className="text-sm font-semibold text-stone-800">
            {current?.label ?? title}
          </span>
          <span className="flex items-center gap-2">
            {waiting > 0 && !open && (
              <span className="rounded-full bg-brand-800 px-2 py-0.5 text-[11px] font-bold leading-none text-white">
                {waiting > 99 ? "99+" : waiting}
              </span>
            )}
            <span className="text-stone-400" aria-hidden>
              {open ? "▲" : "▼"}
            </span>
          </span>
        </button>
      </div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside
          className={`${
            open ? "block" : "hidden"
          } h-fit w-full shrink-0 rounded-lg border border-stone-200 bg-white p-3 lg:block lg:w-64`}
        >
          <p className="mb-2 px-2 pt-1 font-display text-sm font-semibold uppercase tracking-wide text-stone-500">
            {title}
          </p>
          <nav className="flex flex-col gap-1">
            {sections.map((section, i) => (
              <div key={section.name ?? `ungrouped-${i}`} className={i > 0 ? "mt-3" : undefined}>
                {section.name && (
                  <p className="mb-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">
                    {section.name}
                  </p>
                )}
                <div className="flex flex-col gap-1">{section.items.map(link)}</div>
              </div>
            ))}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
