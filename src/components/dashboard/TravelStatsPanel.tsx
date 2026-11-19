import Link from "next/link";
import type { TravelStats } from "@/lib/travelStats";

const ICONS: Record<string, string> = {
  total: "M6 8h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2Zm3 0V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2",
  upcoming: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  completed: "M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-5-2.5-4.5 5L9 12",
  saved: "M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.6-7 10-7 10Z",
};

function Item({ id, label, value, href }: { id: string; label: string; value: number; href?: string }) {
  const body = (
    <>
      <span className="flex h-9 w-9 shrink-0 sm:h-10 sm:w-10 items-center justify-center rounded-full border border-[#B89550] text-[#B89550]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <path d={ICONS[id]} />
        </svg>
      </span>
      <span className="min-w-0">
        <span className="block font-display text-2xl font-bold leading-none text-[#18334D]">{value}</span>
        <span className="mt-1 block whitespace-nowrap text-xs text-stone-500">{label}</span>
      </span>
    </>
  );
  const cls = "flex items-center gap-2.5 px-3 py-3 sm:px-3";
  return href ? (
    <Link
      href={href}
      className={`${cls} rounded-xl transition hover:bg-[#F7F8FA] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B89550]`}
    >
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Four numbers from the traveler's bookings. "Saved" has no page: there is no saving feature yet. */
export default function TravelStatsPanel({ stats }: { stats: TravelStats }) {
  return (
    <section
      aria-label="Travel statistics"
      className="grid h-full grid-cols-2 content-center gap-y-1 rounded-2xl border border-stone-200 bg-white p-2 shadow-sm sm:grid-cols-4 sm:divide-x sm:divide-stone-200 sm:p-2"
    >
      <Item id="total" label="Total Trips" value={stats.total} href="#upcoming-trips" />
      <Item id="upcoming" label="Upcoming" value={stats.upcoming} href="#upcoming-trips" />
      <Item id="completed" label="Completed" value={stats.completed} href="#past-trips" />
      <Item id="saved" label="Saved Trips" value={stats.saved} />
    </section>
  );
}
