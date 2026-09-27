"use client";

import { usePathname } from "next/navigation";
import AutoReveal from "@/components/AutoReveal";

/**
 * Hides the public NavBar/Footer (and the AI chat widget — see `chat`
 * below) on /admin routes (which have their own sidebar navigation) and on
 * /login and /register (which have their own logo + copyright via
 * AuthLayout, and are the entry point into /admin for signed-out users —
 * so they need the same chrome-free treatment). NavBar/Footer/chat are
 * rendered server-side in the root layout and passed in as already-resolved
 * elements, so this client component only decides whether to show them —
 * it never renders them itself.
 *
 * It also owns the <main> wrapper, because the homepage is the one route
 * that needs full-bleed bands (edge-to-edge colour and media sections). The
 * shared `max-w-6xl` container would otherwise clip them, and the usual
 * `100vw` breakout trick overflows by the width of the scrollbar. Every
 * other route keeps the identical container it had before.
 */
const NO_CHROME_PREFIXES = ["/admin", "/login", "/register"];

/** Routes that lay out their own width, section by section. */
const FULL_BLEED_PATHS = ["/"];

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
  const fullBleed = FULL_BLEED_PATHS.includes(pathname ?? "");

  return (
    <>
      {!hideChrome && <AutoReveal />}
      {!hideChrome && nav}
      <main className={fullBleed ? "pb-6" : "mx-auto max-w-6xl px-4 py-6 sm:px-6"}>{children}</main>
      {!hideChrome && footer}
      {!hideChrome && chat}
    </>
  );
}
