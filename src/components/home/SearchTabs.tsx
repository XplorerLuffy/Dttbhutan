"use client";

import { useState } from "react";
import { motion } from "framer-motion";

type Tab = "packages" | "custom-tour";

const TABS: { id: Tab; label: string }[] = [
  { id: "packages", label: "Tour Packages" },
  { id: "custom-tour", label: "Custom Tour" },
];

type Destination = { id: string; name: string; slug: string };

/**
 * Booking.com-style unified search: one card, category tabs up top, a
 * form tailored to that category underneath. The packages form is a plain
 * GET — it navigates to /packages with the matching query params, so no
 * separate search backend is needed here.
 */
export default function SearchTabs({ destinations }: { destinations: Destination[] }) {
  const [tab, setTab] = useState<Tab>("packages");

  return (
    <div className="mx-auto w-full rounded-2xl bg-white p-2 shadow-xl">
      <div className="flex flex-wrap gap-1 border-b border-stone-100 px-2 pt-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className="relative px-4 py-2.5 text-sm font-medium text-stone-500 transition-colors hover:text-brand-700 data-[active=true]:text-brand-800"
            data-active={tab === t.id}
          >
            {t.label}
            {tab === t.id && (
              <motion.div
                layoutId="search-tab-underline"
                className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-brand-700"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === "packages" && (
          <form method="get" action="/packages" className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <label className="flex-1 text-sm">
              <span className="mb-1.5 block font-semibold text-stone-900">Destination</span>
              <select name="destination" defaultValue="" className="input">
                <option value="">All Destinations</option>
                {destinations.map((d) => (
                  <option key={d.id} value={d.slug}>
                    {d.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex-1 text-sm">
              <span className="mb-1.5 block font-semibold text-stone-900">Duration</span>
              <select name="duration" defaultValue="" className="input">
                <option value="">Any Duration</option>
                <option value="1-3">1-3 days</option>
                <option value="4-6">4-6 days</option>
                <option value="7-10">7-10 days</option>
                <option value="11+">11+ days</option>
              </select>
            </label>
            <SearchButton />
          </form>
        )}

        {tab === "custom-tour" && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <p className="flex-1 self-center text-sm text-stone-500">
              Tell us your dates, interests, and pace — we&apos;ll build a Bhutan itinerary just for you.
            </p>
            <motion.a
              href="/custom-tour"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-center"
            >
              Start custom tour
            </motion.a>
          </div>
        )}
      </div>
    </div>
  );
}

function SearchButton() {
  return (
    <motion.button
      type="submit"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="btn-primary flex items-center justify-center gap-2 px-8 py-2.5 sm:shrink-0"
    >
      <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
        <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
      Search
    </motion.button>
  );
}
