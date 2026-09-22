"use client";

import { usePathname } from "next/navigation";

/**
 * Hides the public NavBar/Footer (and the AI chat widget — see `chat`
 * below) on /admin routes (which have their own sidebar navigation) and on
 * /login and /register (which have their own logo + copyright via
 * AuthLayout, and are the entry point into /admin for signed-out users —
 * so they need the same chrome-free treatment). NavBar/Footer/chat are
 * rendered server-side in the root layout and passed in as already-resolved
 * elements, so this client component only decides whether to show them —
 * it never renders them itself.
 */
const NO_CHROME_PREFIXES = ["/admin", "/login", "/register"];

export default function SiteChrome({
  nav,
  footer,
  chat,
  children,
}: {
  nav: React.ReactNode;
  footer: React.ReactNode;
  /** Optional — omitted entirely on layouts that don't have one. */
  chat?: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const hideChrome = NO_CHROME_PREFIXES.some((prefix) => pathname?.startsWith(prefix));

  return (
    <>
      {!hideChrome && nav}
      {children}
      {!hideChrome && footer}
      {!hideChrome && chat}
    </>
  );
}
