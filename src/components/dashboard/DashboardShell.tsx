"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import LogoMark from "@/components/Logo";
import LogoutButton from "@/components/LogoutButton";

/**
 * A persistent left-hand navigation shell for multi-page dashboards —
 * modeled on Booking.com's Partner Extranet, where every admin/vendor
 * screen lives behind the same sidebar rather than relying on the site's
 * top nav alone.
 */
export default function DashboardShell({
  title,
  nav,
  children,
}: {
  title: string;
  nav: { href: string; label: string }[];
  children: React.ReactNode;
}) {
  const pathname = usePathname();

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

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="h-fit w-full shrink-0 rounded-lg border border-stone-200 bg-white p-3 lg:w-64">
          <p className="mb-2 px-2 pt-1 font-display text-sm font-semibold uppercase tracking-wide text-stone-500">
            {title}
          </p>
          <nav className="flex flex-row flex-wrap gap-1 lg:flex-col">
            {nav.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand-50 text-brand-800"
                      : "text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  );
}
