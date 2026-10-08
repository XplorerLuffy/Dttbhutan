import type { Metadata } from "next";
import DashboardShell, { type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth";
import { getAdminWorkload } from "@/lib/admin/workload";
import { getSiteContent } from "@/lib/content";
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
  // the sign-in form and nothing else — no hint of who is signed in or what
  // lies behind it — and signing in re-renders the admin page asked for.
  // (Sending a non-admin to their own dashboard instead landed a guide
  // account with no listing on the guide sign-up form.)
  if (!user || user.role !== "ADMIN") {
    return (
      <AuthLayout>
        <h1 className="mb-6 text-center text-2xl font-bold">Admin sign-in</h1>
        <LoginForm admin />
      </AuthLayout>
    );
  }

  const [work, content] = await Promise.all([getAdminWorkload(), getSiteContent()]);

  const nav: DashboardNavItem[] = [
    { href: "/chim", label: "Overview", icon: "overview", section: "Today" },

    { href: "/chim/bookings", label: "Bookings", icon: "bookings", section: "Operations", badge: work.bookings },
    { href: "/chim/enquiries", label: "Enquiries", icon: "enquiries", section: "Operations", badge: work.enquiries },
    {
      href: "/chim/custom-tours",
      label: "Custom tour requests", icon: "custom",
      section: "Operations",
      badge: work.customTours,
    },
    {
      href: "/chim/vendors",
      label: "Vendor approvals", icon: "vendors",
      section: "Operations",
      badge: work.vendors,
    },
    {
      href: "/chim/gps/trips",
      label: "GPS mileage reports", icon: "gps",
      section: "Operations",
      badge: work.flaggedTrips,
    },

    { href: "/chim/packages", label: "Package tours", icon: "packages", section: "Catalogue" },
    { href: "/chim/destinations", label: "Destinations", icon: "destinations", section: "Catalogue" },
    { href: "/chim/travel-guide", label: "Travel guide", icon: "guide", section: "Catalogue" },

    { href: "/chim/content", label: "Site content", icon: "content", section: "Content" },
    { href: "/chim/content/pages", label: "Page content", icon: "pages", section: "Content" },
    { href: "/chim/knowledge", label: "DRUKA knowledge", icon: "knowledge", section: "Content" },

    { href: "/chim/exchange-rates", label: "Exchange rates", icon: "rates", section: "Settings" },
    { href: "/chim/account", label: "Your account", icon: "account", section: "Settings" },
  ];

  return (
    <DashboardShell
      title="Admin"
      nav={nav}
      realm="admin"
      user={{ name: user.name, email: user.email }}
      tagline={content("footer.tagline")}
    >
      <AdminSessionGuard idleMs={ADMIN_IDLE_MS} />
      {children}
    </DashboardShell>
  );
}
