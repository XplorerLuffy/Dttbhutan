"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * The dark rail down the left of the assistant workspace.
 *
 * A fixed column on desktop; on phones it collapses to a drawer the header
 * opens, because at 390px a 240px rail would leave the conversation about
 * 150px wide.
 */

type NavItem = { href: string; label: string; icon: React.ReactNode };

export default function AssistantSidebar({
  brandName,
  tagline,
  footerNote,
  open,
  onClose,
}: {
  brandName: string;
  tagline: string;
  footerNote: string;
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/assistant", label: "AI Travel Assistant", icon: <ChatIcon /> },
    { href: "/", label: "Home", icon: <HomeIcon /> },
    { href: "/packages", label: "Itineraries", icon: <MapIcon /> },
    { href: "/guides", label: "Tour Guides", icon: <PersonIcon /> },
    { href: "/dashboard", label: "My Bookings", icon: <CalendarIcon /> },
    { href: "/gallery", label: "Gallery", icon: <BookmarkIcon /> },
  ];

  return (
    <>
      {/* Scrim, phones only — the rail is a drawer there. */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-ink-950 text-white transition-transform duration-300 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="px-6 pb-6 pt-8 text-center">
          <MountainMark className="mx-auto h-9 w-auto text-brass-400" />
          <p className="mt-3 text-balance font-display text-base font-bold leading-snug tracking-wide">
            {brandName}
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/45">{tagline}</p>
        </div>

        <nav className="mt-2 flex-1 space-y-1 px-3">
          {items.map((item) => {
            const active = item.href === "/assistant" ? pathname === "/assistant" : false;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                  active
                    ? "bg-brass-500/20 font-semibold text-brass-200"
                    : "text-white/70 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span aria-hidden className="shrink-0">
                  {item.icon}
                </span>
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="px-6 pb-8 pt-6">
          <RidgeArt className="mx-auto h-16 w-full text-brass-500/30" />
          <p className="mt-4 whitespace-pre-line font-display text-sm italic leading-relaxed text-brass-300">
            {footerNote}
          </p>
        </div>
      </aside>
    </>
  );
}

/* Inline SVGs rather than an icon package: eight glyphs used in one place
   don't justify the dependency, and the mark is bespoke anyway. */
const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

export function MountainMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 32" className={className} aria-hidden>
      <path d="M2 28 L16 6 L24 18 L31 9 L46 28 Z" fill="currentColor" opacity="0.9" />
      <path d="M16 6 L21 14 L11 14 Z" fill="#fff" opacity="0.35" />
    </svg>
  );
}

function RidgeArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 60" className={className} aria-hidden {...STROKE} strokeWidth={1.2}>
      <path d="M0 55 L38 20 L58 40 L86 12 L116 44 L146 22 L200 55" />
      <path d="M0 58 L52 34 L92 52 L134 30 L200 58" opacity="0.55" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
      <path d="M21 12a8 8 0 0 1-8 8H5l-2 2V12a8 8 0 0 1 8-8h2a8 8 0 0 1 8 8Z" />
      <path d="M9 11h6M9 15h3" />
    </svg>
  );
}

function HomeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
      <path d="M4 11 12 4l8 7" />
      <path d="M6.5 9.5V20h11V9.5" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
      <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z" />
      <path d="M9 4v13M15 7v13" />
    </svg>
  );
}

function PersonIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
      <circle cx="12" cy="8" r="3.4" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
      <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
      <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
      <path d="M7 4h10v16l-5-4-5 4V4Z" />
    </svg>
  );
}
