"use client";

import { useRef, useState } from "react";
import { useClickOutside } from "@/lib/hooks/useClickOutside";

/**
 * A click-to-toggle nav dropdown (mega-menu trigger). Click-based rather
 * than hover-based so it behaves the same on touch and desktop — Booking/
 * Druk Asia-style multi-column panels underneath a nav label.
 */
export default function NavMenu({
  label,
  panelClassName,
  children,
}: {
  label: string;
  panelClassName?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  useClickOutside(wrapRef, () => setOpen(false));

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-stone-600 hover:text-stone-900"
        aria-expanded={open}
      >
        {label}
        <svg viewBox="0 0 20 20" fill="currentColor" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`}>
          <path d="M5.5 7.5l4.5 5 4.5-5z" />
        </svg>
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className={`fixed inset-x-4 top-[4.5rem] z-30 rounded-lg border border-stone-200 bg-white p-5 shadow-xl sm:absolute sm:inset-x-auto sm:left-1/2 sm:top-full sm:mt-3 sm:w-screen sm:max-w-md sm:-translate-x-1/2 sm:max-h-none sm:overflow-visible max-h-[70vh] overflow-y-auto ${panelClassName ?? ""}`}
        >
          {children}
        </div>
      )}
    </div>
  );
}
