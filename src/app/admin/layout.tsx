import { redirect } from "next/navigation";
import DashboardShell, { type DashboardNavItem } from "@/components/dashboard/DashboardShell";
import { getCurrentUser } from "@/lib/auth";
import { dashboardPathForRole } from "@/lib/roles";
import { getAdminWorkload } from "@/lib/admin/workload";

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
  if (!user) redirect("/login");
  if (user.role !== "ADMIN") redirect(dashboardPathForRole(user.role));

  const work = await getAdminWorkload();

  const nav: DashboardNavItem[] = [
    { href: "/admin", label: "Overview", section: "Today" },

    { href: "/admin/bookings", label: "Bookings", section: "Operations", badge: work.bookings },
    { href: "/admin/enquiries", label: "Enquiries", section: "Operations", badge: work.enquiries },
    {
      href: "/admin/custom-tours",
      label: "Custom tour requests",
      section: "Operations",
      badge: work.customTours,
    },
    {
      href: "/admin/vendors",
      label: "Vendor approvals",
      section: "Operations",
      badge: work.vendors,
    },
    {
      href: "/admin/gps/trips",
      label: "GPS mileage reports",
      section: "Operations",
      badge: work.flaggedTrips,
    },

    { href: "/admin/packages", label: "Package tours", section: "Catalogue" },
    { href: "/admin/destinations", label: "Destinations", section: "Catalogue" },
    { href: "/admin/travel-guide", label: "Travel guide", section: "Catalogue" },

    { href: "/admin/content", label: "Site content", section: "Content" },
    { href: "/admin/content/pages", label: "Page content", section: "Content" },
    { href: "/admin/knowledge", label: "DRUKA knowledge", section: "Content" },

    { href: "/admin/exchange-rates", label: "Exchange rates", section: "Settings" },
    { href: "/admin/account", label: "Your account", section: "Settings" },
  ];

  return (
    <DashboardShell title="Admin" nav={nav}>
      {children}
    </DashboardShell>
  );
}
