"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { safeNextPath } from "@/lib/safeNext";

/**
 * The "Sign up" / "Log in" link between the two auth pages. It keeps `?next=`
 * so someone who clicks across still lands back on the trip they were
 * booking. Read after load because the pages are static and cannot know it.
 */
export default function CarryNextLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  const [target, setTarget] = useState(href);
  useEffect(() => {
    const next = safeNextPath(new URLSearchParams(window.location.search).get("next"));
    if (next) setTarget(`${href}?next=${encodeURIComponent(next)}`);
  }, [href]);
  return (
    <Link href={target} className={className}>
      {children}
    </Link>
  );
}
