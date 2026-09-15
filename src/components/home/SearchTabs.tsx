"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

type Tab = "guides" | "hotels" | "transport" | "flights" | "packages" | "destinations";

const TABS: { id: Tab; label: string }[] = [
  { id: "guides", label: "Guides" },
  { id: "hotels", label: "Hotels" },
  { id: "transport", label: "Transport" },
  { id: "flights", label: "Flights" },
  { id: "packages", label: "Packages" },
  { id: "destinations", label: "Destinations" },
];

type Destination = { id: string; name: string; slug: string };

/**
 * Booking.com-style unified search: one card, category tabs up top, a
 * form tailored to that category underneath. Each form is a plain GET —
 * it navigates to that category's existing search page with the matching
 * query params, so no separate search backend is needed here.
 */
export default function SearchTabs({ destinations }: { destinations: Destination[] }) {
  const [tab, setTab] = useState<Tab>("guides");
  const router = useRouter();

  return (
    <div className="mx-auto max-w-3xl rounded-2xl bg-white p-2 shadow-xl">
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
        {tab === "guides" && (
          <form method="get" action="/guides" className="grid gap-2 sm:grid-cols-4">
            <input
              name="maxPrice"
              type="number"
              min={1}
              placeholder="Max BTN/day (optional)"
              className="input sm:col-span-3"
            />
            <SearchButton />
          </form>
        )}

        {tab === "hotels" && (
          <form method="get" action="/hotels" className="grid gap-2 sm:grid-cols-4">
            <select name="destinationId" defaultValue="" className="input sm:col-span-3">
              <option value="">Any destination</option>
              {destinations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            <SearchButton />
          </form>
        )}

        {tab === "transport" && (
          <form method="get" action="/vehicles" className="grid gap-2 sm:grid-cols-4">
            <select name="type" defaultValue="" className="input sm:col-span-2">
              <option value="">Any vehicle type</option>
              <option value="SEDAN">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="VAN">Van</option>
              <option value="BUS">Bus</option>
            </select>
            <input
              name="minCapacity"
              type="number"
              min={1}
              placeholder="Min seats"
              className="input"
            />
            <SearchButton />
          </form>
        )}

        {tab === "flights" && (
          <form method="get" action="/flights" className="grid gap-2 sm:grid-cols-6">
            <input
              name="origin"
              placeholder="From (PBH)"
              maxLength={3}
              required
              className="input uppercase sm:col-span-1"
            />
            <input
              name="destination"
              placeholder="To (BKK)"
              maxLength={3}
              required
              className="input uppercase sm:col-span-1"
            />
            <input name="departureDate" type="date" required className="input sm:col-span-2" />
            <input
              name="passengers"
              type="number"
              min={1}
              max={9}
              defaultValue={1}
              className="input"
            />
            <input type="hidden" name="cabinClass" value="ECONOMY" />
            <SearchButton />
          </form>
        )}

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

function SearchButton() {
  return (
    <motion.button
      type="submit"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      className="btn-primary"
    >
      Search
    </motion.button>
  );
}
