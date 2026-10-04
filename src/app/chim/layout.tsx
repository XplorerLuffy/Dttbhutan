import type { Metadata } from "next";
import DashboardShell, { type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth";
import { getAdminWorkload } from "@/lib/admin/workload";
import { ADMIN_IDLE_MS } from "@/lib/adminSession";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";
import AdminSessionGuard from "@/components/admin/AdminSessionGuard";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Grouped rather than one list of thirteen: an admin coming in to approve a
 * guide and one coming in to reword a page are doing different jobs, and the
 * headings let either of them stop reading after the right third.
 *
 * The badges are the point of it. Before, nothing on any screen said there
 * were four unread enquiries except the overview — so the only way to find
 * work was to visit every page in turn.
 */
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // The gate belongs here, before anything renders. Each admin page also
  // checks, but a layout renders before its page: left to the pages, an
  // anonymous visitor's request ran the workload queries and began streaming
  // the admin sidebar before the page's redirect caught up with it.
  const user = await getCurrentUser();
  // /chim is the admin's way in: to anyone who isn't a signed-in admin it is
  // the sign-in form, and signing in re-renders whichever admin page was
  // asked for. A non-admin account is told which account they're on rather
  // than being sent to that account's dashboard — a guide account with no
  // listing yet lands on the guide sign-up form, which reads as /chim broken.
  if (!user || user.role !== "ADMIN") {
    return (
      <AuthLayout>
        <h1 className="mb-6 text-center text-2xl font-bold">Admin sign-in</h1>
        {user && (
          <p className="mb-4 rounded-md bg-stone-100 px-3 py-2 text-sm text-stone-700">
            You&apos;re signed in as <strong>{user.email}</strong>, which isn&apos;t an admin
            account. Log in with the admin account to continue.
          </p>
        )}
        <LoginForm admin />
      </AuthLayout>
    );
  }

  const work = await getAdminWorkload();

  const nav: DashboardNavItem[] = [
    { href: "/chim", label: "Overview", section: "Today" },

    { href: "/chim/bookings", label: "Bookings", section: "Operations", badge: work.bookings },
    { href: "/chim/enquiries", label: "Enquiries", section: "Operations", badge: work.enquiries },
    {
      href: "/chim/custom-tours",
      label: "Custom tour requests",
      section: "Operations",
      badge: work.customTours,
    },
    {
      href: "/chim/vendors",
      label: "Vendor approvals",
      section: "Operations",
      badge: work.vendors,
    },
    {
      href: "/chim/gps/trips",
      label: "GPS mileage reports",
      section: "Operations",
      badge: work.flaggedTrips,
    },

    { href: "/chim/packages", label: "Package tours", section: "Catalogue" },
    { href: "/chim/destinations", label: "Destinations", section: "Catalogue" },
    { href: "/chim/travel-guide", label: "Travel guide", section: "Catalogue" },

    { href: "/chim/content", label: "Site content", section: "Content" },
    { href: "/chim/content/pages", label: "Page content", section: "Content" },
    { href: "/chim/knowledge", label: "DRUKA knowledge", section: "Content" },

    { href: "/chim/exchange-rates", label: "Exchange rates", section: "Settings" },
    { href: "/chim/account", label: "Your account", section: "Settings" },
  ];

  return (
    <DashboardShell title="Admin" nav={nav}>
      <AdminSessionGuard idleMs={ADMIN_IDLE_MS} />
      {children}
    </DashboardShell>
  );
}
