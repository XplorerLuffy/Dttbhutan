import Link from "next/link";
import { countdown, waitProgress } from "@/lib/nextAdventure";

export type NextAdventureData = {
  id: string;
  title: string;
  imageUrl: string | null;
  destination: string;
  status: string; // booking status
  paymentLabel: string | null;
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  durationDays: number;
  travelers: number | null;
};

const fmt = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

function Icon({ d }: { d: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-[#B89550]" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={d} />
    </svg>
  );
}

export default function NextAdventureCard({ data }: { data: NextAdventureData | null }) {
  if (!data) {
    return (
      <section aria-label="Your next adventure" className="flex h-full flex-col items-center justify-center rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#B89550]">Your next adventure</p>
        <h2 className="mt-2 font-display text-xl font-semibold text-[#18334D]">No upcoming adventures yet.</h2>
        <p className="mt-1 text-sm text-stone-500">Discover your next journey through Bhutan.</p>
        <Link href="/packages" className="mt-5 rounded-xl bg-[#B89550] px-5 py-2.5 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18334D]">
          Explore Tours
        </Link>
      </section>
    );
  }
  const now = new Date();
  const cd = countdown(data.startDate, data.endDate, now);
  const pct = Math.round(waitProgress(data.createdAt, data.startDate, now) * 100);
  const lead = cd.kind === "days" ? "Your trip is approaching" : cd.kind === "today" ? "Today's the day" : "Enjoy your trip";
  const badge = data.status === "CONFIRMED" ? "Confirmed" : data.status.charAt(0) + data.status.slice(1).toLowerCase();

  return (
    <section aria-label="Your next adventure" className="flex h-full flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm sm:flex-row">
      <div className="relative h-48 shrink-0 bg-gradient-to-br from-[#18334D] to-[#2d5273] sm:h-auto sm:w-[38%]">
        {data.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.imageUrl} alt={data.title} className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-md bg-[#B89550] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white">Your next adventure</span>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {data.status === "CONFIRMED" && "✓ "}
            {badge}
          </span>
        </div>
        <h2 className="mt-3 font-display text-2xl font-bold text-[#18334D] sm:text-3xl">{data.title}</h2>
        <p className="mt-1.5 flex items-center gap-2 text-sm text-stone-600">
          <Icon d="M12 21s-6-5.2-6-10a6 6 0 1 1 12 0c0 4.8-6 10-6 10Zm0-7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
          {data.destination}
        </p>
        <ul className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#18334D]">
          <li className="flex items-center gap-2">
            <Icon d="M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z" />
            {fmt(data.startDate)}
          </li>
          {data.durationDays > 0 && (
            <li className="flex items-center gap-2 border-l border-stone-200 pl-4">
              <Icon d="M3 18 9 8l4 6 3-4 5 8Z" />
              {data.durationDays} {data.durationDays === 1 ? "Day" : "Days"}
            </li>
          )}
          {data.travelers != null && (
            <li className="flex items-center gap-2 border-l border-stone-200 pl-4">
              <Icon d="M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1m8-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm8 9v-1a4 4 0 0 0-3-3.9" />
              {data.travelers} {data.travelers === 1 ? "Traveler" : "Travelers"}
            </li>
          )}
        </ul>
        {data.paymentLabel && <p className="mt-2 text-xs text-stone-500">Payment: {data.paymentLabel}</p>}

        <div className="mt-5 border-t border-stone-100 pt-4">
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-stone-600">{lead}</span>
            <span className="font-semibold text-emerald-700" data-testid="countdown">{cd.kind === "days" ? cd.text : ""}</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200" role="progressbar" aria-label="Time from booking to departure" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-full rounded-full bg-[#B89550]" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <Link href={`/dashboard/bookings/${data.id}`} className="mt-5 inline-flex w-full items-center justify-center gap-2 self-start rounded-xl bg-[#B89550] px-5 py-3 text-sm font-semibold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18334D] sm:w-auto">
          View Trip Details <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
