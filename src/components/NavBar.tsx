import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import { prisma } from "@/lib/prisma";
import LogoutButton from "@/components/LogoutButton";
import LogoMark from "@/components/Logo";
import DestinationsMenu from "@/components/nav/DestinationsMenu";
import PackagesMenu from "@/components/nav/PackagesMenu";

export default async function NavBar() {
  const [user, destinations, packages] = await Promise.all([
    getCurrentUser(),
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
          <span className="hidden font-display text-lg font-semibold text-brand-800 sm:inline">
            Droelma Tours &amp; Travels
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <DestinationsMenu destinations={destinations} />
          <Link href="/guides" className="text-stone-600 hover:text-stone-900">
            Guides
          </Link>
          <Link href="/hotels" className="text-stone-600 hover:text-stone-900">
            Hotels
          </Link>
          <Link href="/vehicles" className="text-stone-600 hover:text-stone-900">
            Transport
          </Link>
          <Link href="/flights" className="text-stone-600 hover:text-stone-900">
            Flights
          </Link>
          <PackagesMenu packages={packages} />
          <Link href="/travel-guide" className="text-stone-600 hover:text-stone-900">
            Travel Guide
          </Link>

          {user ? (
            <>
              <Link
                href={dashboardPathForRole(user.role)}
                className="font-medium text-brand-700 hover:text-brand-900"
              >
                Dashboard
              </Link>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link href="/login" className="text-stone-600 hover:text-stone-900">
                Log in
              </Link>
              <Link
                href="/register"
                className="rounded-md bg-brand-700 px-3 py-1.5 font-medium text-white hover:bg-brand-800"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
