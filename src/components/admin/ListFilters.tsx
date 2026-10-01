"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Status tabs and a search box for a long admin list.
 *
 * Both live in the URL rather than in component state, so a filtered list can
 * be bookmarked, reloaded, opened in a second tab, and linked to — which is
 * what lets the overview point straight at "bookings waiting on confirmation"
 * instead of at the whole list.
 */
export type FilterTab = { value: string; label: string; count: number };

export default function ListFilters({
  tabs,
  active,
  placeholder,
}: {
  tabs: FilterTab[];
  /** The tab currently showing, by `value`. */
  active: string;
  placeholder: string;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [query, setQuery] = useState(params.get("q") ?? "");

  // Typing a character per request would put a query on the database for every
  // keystroke; a third of a second after the last one is one query per word.
  useEffect(() => {
    const current = params.get("q") ?? "";
    if (query === current) return;

    const timer = setTimeout(() => {
      const next = new URLSearchParams(params.toString());
      if (query) next.set("q", query);
      else next.delete("q");
      // Searching within a filtered list starts again at its first page.
      next.delete("page");
      router.replace(`?${next.toString()}`);
    }, 350);

    return () => clearTimeout(timer);
  }, [query, params, router]);

  const href = (value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set("status", value);
    else next.delete("status");
    next.delete("page");
    const qs = next.toString();
    return qs ? `?${qs}` : "?";
  };

  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-wrap gap-1.5">
        {tabs.map((tab) => {
          const on = tab.value === active;
          return (
            <Link
              key={tab.value || "all"}
              href={href(tab.value)}
              aria-current={on ? "true" : undefined}
              className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                on
                  ? "bg-brand-800 text-white"
                  : "border border-stone-200 bg-white text-stone-600 hover:border-stone-300 hover:text-stone-900"
              }`}
            >
              {tab.label}
              <span className={on ? "ml-1.5 text-white/70" : "ml-1.5 text-stone-400"}>
                {tab.count}
              </span>
            </Link>
          );
        })}
      </div>

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm sm:w-72"
      />
    </div>
  );
}
