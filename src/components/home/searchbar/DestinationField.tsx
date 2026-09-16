"use client";

import { useRef, useState } from "react";
import { useClickOutside } from "./useClickOutside";

type Destination = { id: string; name: string; slug: string };

/**
 * Booking.com-style destination field: a text box that opens a dropdown
 * of suggestions (a "Popular destinations" list, filtered live as you
 * type) instead of a plain <select>. Selecting one sets a hidden
 * destinationId input so the enclosing <form method="get"> submits it
 * like any other field.
 */
export default function DestinationField({
  destinations,
  name = "destinationId",
}: {
  destinations: Destination[];
  name?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false));

  const popular = destinations.slice(0, 6);
  const filtered = query.trim()
    ? destinations.filter((d) => d.name.toLowerCase().includes(query.trim().toLowerCase()))
    : popular;

  function select(d: Destination) {
    setQuery(d.name);
    setSelectedId(d.id);
    setOpen(false);
  }

  return (
    <div ref={wrapRef} className="relative flex-1">
      <input type="hidden" name={name} value={selectedId} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-md border-2 border-gold-400 bg-white px-4 py-3 text-left"
      >
        <IconBed className="h-5 w-5 shrink-0 text-stone-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-stone-500">Enter destination</span>
          <span className="block truncate text-sm font-medium text-stone-900">
            {query || "Where are you going?"}
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[280px] rounded-lg border border-stone-200 bg-white p-2 shadow-xl sm:w-96">
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedId("");
            }}
            placeholder="Search a dzongkhag..."
            className="input mb-2"
          />
          <p className="px-2 pb-1 pt-1 text-xs font-semibold uppercase tracking-wide text-stone-400">
            {query.trim() ? "Matching destinations" : "Popular destinations"}
          </p>
          <ul className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <li className="px-2 py-2 text-sm text-stone-500">No destinations found.</li>
            )}
            {filtered.map((d) => (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => select(d)}
                  className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm text-stone-700 hover:bg-brand-50"
                >
                  <IconPin className="h-4 w-4 shrink-0 text-stone-400" />
                  {d.name}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function IconBed({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M3 18v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 18v2M21 18v2M3 13h18"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect x="5" y="9" width="6" height="4" rx="1" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconPin({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21s7-6.5 7-11.5a7 7 0 1 0-14 0C5 14.5 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="12" cy="9.5" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}
