"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { REGION_LABEL, REGION_ORDER } from "@/lib/regions";
import type { DzongkhagRegion } from "@prisma/client";

type Destination = { id: string; name: string; slug: string; region: DzongkhagRegion };
type Package = { id: string; title: string; slug: string; durationDays: number };

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
    >
      <path d="M5.5 7.5l4.5 5 4.5-5z" />
    </svg>
  );
}

function Accordion({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-stone-100">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between py-3 text-left text-base font-medium text-stone-800"
        aria-expanded={open}
      >
        {label}
        <ChevronIcon open={open} />
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export default function MobileMenu({
  destinations,
  packages,
  isLoggedIn,
  dashboardHref,
  className,
}: {
  destinations: Destination[];
  packages: Package[];
  isLoggedIn: boolean;
  dashboardHref: string | null;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const byRegion = new Map<DzongkhagRegion, Destination[]>();
  for (const d of destinations) byRegion.set(d.region, [...(byRegion.get(d.region) ?? []), d]);

  return (
    <div className={className}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="flex h-10 w-10 items-center justify-center rounded-md text-stone-700 hover:bg-stone-100"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
          <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 right-0 flex w-[85%] max-w-sm flex-col bg-white shadow-xl">
            <div className="flex shrink-0 items-center justify-between border-b border-stone-200 px-4 py-3">
              <span className="font-display text-base font-semibold text-brand-800">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="flex h-9 w-9 items-center justify-center rounded-md text-stone-500 hover:bg-stone-100"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                  <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-4">
              <Accordion label="Destinations">
                <div className="space-y-4">
                  {REGION_ORDER.map((region) => (
                    <div key={region}>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                        {REGION_LABEL[region]}
                      </p>
                      <ul className="space-y-2">
                        {(byRegion.get(region) ?? []).map((d) => (
                          <li key={d.id}>
                            <Link
                              href={`/destinations/${d.slug}`}
                              onClick={() => setOpen(false)}
                              className="block text-sm text-stone-600 hover:text-brand-700"
                            >
                              {d.name}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                  <Link
                    href="/destinations"
                    onClick={() => setOpen(false)}
                    className="block text-sm font-medium text-brand-700"
                  >
                    Browse all 20 dzongkhags →
                  </Link>
                </div>
              </Accordion>

              <Link href="/guides" onClick={() => setOpen(false)} className="block border-b border-stone-100 py-3 text-base font-medium text-stone-800">
                Guides
              </Link>
              <Link href="/hotels" onClick={() => setOpen(false)} className="block border-b border-stone-100 py-3 text-base font-medium text-stone-800">
                Hotels
              </Link>
              <Link href="/vehicles" onClick={() => setOpen(false)} className="block border-b border-stone-100 py-3 text-base font-medium text-stone-800">
                Transport
              </Link>
              <Link href="/flights" onClick={() => setOpen(false)} className="block border-b border-stone-100 py-3 text-base font-medium text-stone-800">
                Flights
              </Link>

              <Accordion label="Tours & Packages">
                <div className="space-y-4">
                  <ul className="space-y-2">
                    <li>
                      <Link href="/packages" onClick={() => setOpen(false)} className="block">
                        <span className="block text-sm font-medium text-stone-900">Ready-made packages</span>
                        <span className="block text-xs text-stone-500">Fixed-itinerary tours, priced already.</span>
                      </Link>
                    </li>
                    <li>
                      <Link href="/custom-tour" onClick={() => setOpen(false)} className="block">
                        <span className="block text-sm font-medium text-stone-900">Custom & customizable tours</span>
                        <span className="block text-xs text-stone-500">Tell us what you want — we&apos;ll quote it.</span>
                      </Link>
                    </li>
                  </ul>
                  {packages.length > 0 && (
                    <div>
                      <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-stone-400">
                        Featured packages
                      </p>
                      <ul className="space-y-2">
                        {packages.map((p) => (
                          <li key={p.id}>
                            <Link
                              href={`/packages/${p.slug}`}
                              onClick={() => setOpen(false)}
                              className="block text-sm text-stone-600 hover:text-brand-700"
                            >
                              {p.title} <span className="text-stone-400">· {p.durationDays}d</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link href="/packages" onClick={() => setOpen(false)} className="block text-sm font-medium text-brand-700">
                    Browse all packages →
                  </Link>
                </div>
              </Accordion>

              <Link href="/travel-guide" onClick={() => setOpen(false)} className="block border-b border-stone-100 py-3 text-base font-medium text-stone-800">
                Travel Guide
              </Link>
            </nav>

            <div className="shrink-0 border-t border-stone-200 p-4">
              {isLoggedIn ? (
                <div className="flex flex-col gap-2">
                  {dashboardHref && (
                    <Link
                      href={dashboardHref}
                      onClick={() => setOpen(false)}
                      className="btn-primary w-full text-center"
                    >
                      Dashboard
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      await fetch("/api/auth/logout", { method: "POST" });
                      setOpen(false);
                      router.push("/");
                      router.refresh();
                    }}
                    className="btn-secondary w-full text-center"
                  >
                    Log out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/register" onClick={() => setOpen(false)} className="btn-primary w-full text-center">
                    Sign up
                  </Link>
                  <Link href="/login" onClick={() => setOpen(false)} className="btn-secondary w-full text-center">
                    Log in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
