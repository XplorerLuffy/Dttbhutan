import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import LogoutButton from "@/components/LogoutButton";

export default async function NavBar() {
  const user = await getCurrentUser();

  return (
    <header className="border-b border-stone-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
        <Link href="/" className="font-display text-lg font-semibold text-brand-800">
          Dtt Bhutan
        </Link>

        <nav className="flex items-center gap-4 text-sm">
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
