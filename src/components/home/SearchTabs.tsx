"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Tab = "packages" | "custom-tour" | "destinations";

const TABS: { id: Tab; label: string }[] = [
  { id: "packages", label: "Tour Package" },
  { id: "custom-tour", label: "Custom Tour" },
  { id: "destinations", label: "Destination" },
];

type Destination = { id: string; name: string; slug: string };

/**
 * Booking.com-style unified search: one card, category tabs up top, a
 * form tailored to that category underneath. Each form is a plain GET —
 * it navigates to that category's existing search page with the matching
 * query params, so no separate search backend is needed here.
 */
export default function SearchTabs({ destinations }: { destinations: Destination[] }) {
  const [tab, setTab] = useState<Tab>("packages");
  const router = useRouter();

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
          <div className="flex flex-col gap-2 sm:flex-row">
            <p className="flex-1 self-center text-sm text-stone-500">
              Ready-made multi-day tours bundling a guide, hotels, and transport.
            </p>
            <motion.a
              href="/packages"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-center"
            >
              Browse packages
            </motion.a>
          </div>
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

        {tab === "destinations" && (
          <div className="grid gap-2 sm:grid-cols-4">
            <select
              defaultValue=""
              onChange={(e) => e.target.value && router.push(`/destinations/${e.target.value}`)}
              className="input sm:col-span-3"
            >
              <option value="" disabled>
                Jump to a dzongkhag
              </option>
              {destinations.map((d) => (
                <option key={d.id} value={d.slug}>
                  {d.name}
                </option>
              ))}
            </select>
            <motion.a
              href="/destinations"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn-primary text-center"
            >
              Browse all
            </motion.a>
          </div>
        )}
      </div>
    </div>
  );
}
