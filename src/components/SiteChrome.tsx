"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public NavBar/Footer on /admin routes, which have their own
 * sidebar navigation (DashboardShell) and don't need the site's marketing
 * chrome around them. NavBar/Footer are rendered server-side in the root
 * layout and passed in as already-resolved elements, so this client
 * component only decides whether to show them — it never renders them
 * itself.
 */
export default function SiteChrome({
  nav,
  footer,
  children,
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  return (
    <>
      {!isAdmin && nav}
      {children}
      {!isAdmin && footer}
    </>
  );
}
