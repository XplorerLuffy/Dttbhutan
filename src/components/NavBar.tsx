import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { LogoLockup } from "@/components/Logo";
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
  { href: "/travel-guide", label: "Travel Guide" },
  { href: "/about", label: "About Us" },
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

  const link = "text-brand-900 transition-colors hover:text-brand-600";

  return (
    <header className="border-b border-stone-200/70 bg-[#fbf8f4] text-brand-900">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link href="/" aria-label={`${company.name} — home`} className="flex min-w-0 shrink-0 items-center">
          <LogoLockup className="h-11 w-auto max-w-full sm:h-12" />
        </Link>

        <nav className="hidden items-center gap-9 text-[15px] font-semibold lg:flex">
          <PackagesMenu packages={packages} triggerClassName={link} label="Tours" />
          <DestinationsMenu destinations={destinations} triggerClassName={link} />
          {MAIN_LINKS.map((l) => (
            <Link key={l.href} href={l.href} className={link}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 text-sm lg:flex">
          <CurrencySelector className="rounded-lg border border-brand-900/30 bg-transparent px-3 py-1.5 text-sm font-medium text-brand-900 hover:border-brand-900/60" />
          <Link href="/login" className="font-semibold text-brand-900 hover:text-brand-600">
            Log in
          </Link>
          <Link
            href="/custom-tour"
            className="rounded-xl bg-brand-900 px-5 py-2.5 font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Plan Your Trip
          </Link>
        </div>

        <MobileMenu destinations={destinations} packages={packages} className="lg:hidden" />
      </div>
    </header>
  );
}
