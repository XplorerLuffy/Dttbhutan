import Link from "next/link";
import { prisma } from "@/lib/prisma";
import LogoMark from "@/components/Logo";
import DestinationsMenu from "@/components/nav/DestinationsMenu";
import PackagesMenu from "@/components/nav/PackagesMenu";
import MobileMenu from "@/components/nav/MobileMenu";

export default async function NavBar() {
  const [destinations, packages] = await Promise.all([
    prisma.destination.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, region: true },
    }),
    prisma.itinerary.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { pricePerPerson: "asc" },
      select: { id: true, title: true, slug: true, durationDays: true },
    }),
  ]);

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <LogoMark className="h-9 w-auto shrink-0" />
          <span className="font-display text-base font-semibold text-brand-800 sm:text-lg lg:hidden xl:inline">
            Droelma Tours &amp; Travels
          </span>
        </Link>

        <nav className="hidden flex-wrap items-center gap-x-4 gap-y-1 text-sm lg:flex">
          <PackagesMenu packages={packages} />
          <DestinationsMenu destinations={destinations} />
          <Link href="/packages?category=TREKKING" className="text-stone-600 hover:text-stone-900">
            Trekking
          </Link>
          <Link href="/travel-guide" className="text-stone-600 hover:text-stone-900">
            Travel Guide
          </Link>
          <Link href="/gallery" className="text-stone-600 hover:text-stone-900">
            Gallery
          </Link>
          <Link href="/about" className="text-stone-600 hover:text-stone-900">
            About Us
          </Link>
          <Link href="/contact" className="text-stone-600 hover:text-stone-900">
            Contact Us
          </Link>
          <Link
            href="/contact"
            className="rounded-md bg-brand-700 px-3 py-1.5 font-medium text-white hover:bg-brand-800"
          >
            Enquire Now
          </Link>
        </nav>

        <MobileMenu destinations={destinations} packages={packages} className="lg:hidden" />
      </div>
    </header>
  );
}
