"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import LogoutButton from "@/components/LogoutButton";

type Me = { signedIn: false } | { signedIn: true; name: string; dashboardPath: string; role: string };

/**
 * The header's account control. Pages are cached and shared, so they are
 * served with "Log in"; this asks who is signed in once the page is open and
 * swaps in the person's account link and a log-out button. It asks again on
 * every page change (a login ends in a client-side navigation, which does not
 * reload the header) and when the tab regains focus.
 */
export default function NavAccount({ variant = "desktop", onNavigate }: { variant?: "desktop" | "mobile"; onNavigate?: () => void }) {
  const pathname = usePathname();
  const [me, setMe] = useState<Me>({ signedIn: false });

  useEffect(() => {
    let live = true;
    const ask = () =>
      fetch("/api/auth/me", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : { signedIn: false }))
        .then((m: Me) => live && setMe(m))
        .catch(() => {});
    ask();
    const onFocus = () => ask();
    window.addEventListener("focus", onFocus);
    return () => {
      live = false;
      window.removeEventListener("focus", onFocus);
    };
  }, [pathname]);

  const first = me.signedIn ? me.name.trim().split(/\s+/)[0] : "";
  const label = me.signedIn ? (me.role === "TRAVELER" ? "My trips" : "My dashboard") : "";

  if (variant === "mobile") {
    return me.signedIn ? (
      <div className="flex items-center justify-between border-b border-stone-100 py-3">
        <Link href={me.dashboardPath} onClick={onNavigate} className="text-base font-medium text-stone-800">
          {label} <span className="text-stone-400">· {first}</span>
        </Link>
        <LogoutButton className="text-sm font-medium text-stone-600 hover:text-stone-900" />
      </div>
    ) : (
      <Link href="/login" onClick={onNavigate} className="block border-b border-stone-100 py-3 text-base font-medium text-stone-800">
        Log in
      </Link>
    );
  }

  return me.signedIn ? (
    <>
      <Link href={me.dashboardPath} className="font-semibold text-brand-900 hover:text-brand-600" title={`Signed in as ${me.name}`}>
        {label}
      </Link>
      <LogoutButton className="font-medium text-stone-500 hover:text-stone-900" />
    </>
  ) : (
    <Link href="/login" className="font-semibold text-brand-900 hover:text-brand-600">
      Log in
    </Link>
  );
}
