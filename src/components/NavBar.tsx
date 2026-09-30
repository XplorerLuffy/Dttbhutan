import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LogoMarkReverse } from "@/components/Logo";
import DestinationsMenu from "@/components/nav/DestinationsMenu";
import PackagesMenu from "@/components/nav/PackagesMenu";
import MobileMenu from "@/components/nav/MobileMenu";
import CurrencySelector from "@/components/CurrencySelector";
import { getSiteContent, companyFrom } from "@/lib/content";

/**
 * Two-row dark header: brand and account row on top, the trip navigation
 * beneath it.
 *
 * Splitting them is what lets the main links sit at a readable size and
 * even spacing instead of being crushed against the logo — the single row
 * was already overflowing into an xl-only breakpoint, which meant most
 * laptops got the hamburger.
 *
 * The logo uses the reversed variant. On this navy the artwork's blue
 * measures 1.46:1, so the full-colour mark would all but disappear (see
 * the note in Logo.tsx).
 */

const MAIN_LINKS = [
  { href: "/packages?category=TREKKING", label: "Trekking" },
  { href: "/travel-guide", label: "Travel Guide" },
  { href: "/gallery", label: "Gallery" },
  { href: "/about", label: "About Us" },
  // Last in the row but first in intent: the assistant is the front door for
  // anyone who hasn't decided what they want yet, which the fixed links above
  // can't serve.
  { href: "/assistant", label: "Ask DRUKA" },
];

export default async function NavBar() {
  const [destinations, packages, content] = await Promise.all([
    prisma.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { pricePerPerson: "asc" },
      select: { id: true, title: true, slug: true, durationDays: true },
    }),
    getSiteContent(),
  ]);
  const company = companyFrom(content);

  return (
    <header className="bg-brand-900 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <LogoMarkReverse className="h-12 w-auto shrink-0" />
            <span className="font-display text-lg font-semibold tracking-wide text-white sm:text-xl">
              {company.name}
            </span>
          </Link>

          <div className="hidden items-center gap-6 text-sm lg:flex">
            <Link href="/contact" className="text-white/80 transition-colors hover:text-white">
              Contact Us
            </Link>
            <CurrencySelector className="rounded-md border border-white/25 bg-transparent px-2 py-1 text-sm text-white hover:border-white/50 [&>option]:text-stone-900" />
            <Link
              href="/login"
              className="rounded-full bg-white px-5 py-1.5 font-semibold text-brand-900 transition-colors hover:bg-white/90"
            >
              Log in
            </Link>
          </div>

          <MobileMenu destinations={destinations} packages={packages} className="lg:hidden" />
        </div>
      </div>

      <div className="hidden border-t border-white/15 lg:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-4 py-3 sm:px-6">
          <nav className="flex items-center gap-8 text-[15px] font-medium">
            <PackagesMenu packages={packages} triggerClassName="text-white/90 hover:text-white" />
            <DestinationsMenu
              destinations={destinations}
              triggerClassName="text-white/90 hover:text-white"
            />
            {MAIN_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-white/90 transition-colors hover:text-white"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <Link
            href="/contact"
            className="shrink-0 rounded-full bg-gold-400 px-6 py-2 font-display text-sm font-semibold text-brand-950 transition-colors hover:bg-gold-300"
          >
            Enquire Now
          </Link>
        </div>
      </div>
    </header>
  );
}
