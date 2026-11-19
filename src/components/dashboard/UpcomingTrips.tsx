import Link from "next/link";
import StatusBadge from "@/components/StatusBadge";

export type TripRow = {
  id: string;
  title: string;
  imageUrl: string | null;
  destination: string | null;
  startDate: Date;
  endDate: Date;
  durationDays: number;
  travelers: number | null;
  status: string;
};

const md = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const mdy = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const range = (a: Date, b: Date) =>
  a.getUTCFullYear() === b.getUTCFullYear() ? `${md(a)} – ${mdy(b)}` : `${mdy(a)} – ${mdy(b)}`;

function Meta({ children, hideSm }: { children: React.ReactNode; hideSm?: boolean }) {
  return <span className={`items-center gap-1.5 whitespace-nowrap ${hideSm ? "hidden sm:inline-flex" : "inline-flex"}`}>{children}</span>;
}

function Row({ t }: { t: TripRow }) {
  const href = `/dashboard/bookings/${t.id}`;
  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3.5 sm:flex-nowrap sm:px-5">
      <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-[#18334D] to-[#2d5273] sm:h-[4.5rem] sm:w-28">
        {t.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={t.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 basis-40 sm:basis-auto sm:w-48 sm:flex-none lg:w-56">
        <p className="truncate font-display text-base font-bold text-[#18334D]">{t.title}</p>
        {t.destination && <p className="truncate text-sm text-stone-500">{t.destination}</p>}
      </div>
      <div className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 text-sm text-[#18334D] sm:w-auto sm:flex-1 sm:justify-between">
        <Meta>{range(t.startDate, t.endDate)}</Meta>
        <Meta>{t.durationDays} {t.durationDays === 1 ? "Day" : "Days"}</Meta>
        {t.travelers != null && <Meta>{t.travelers} {t.travelers === 1 ? "Traveler" : "Travelers"}</Meta>}
      </div>
      <div className="flex w-full items-center justify-between gap-3 sm:w-auto sm:justify-end">
        <StatusBadge status={t.status} />
        <Link href={href} className="rounded-xl border border-[#B89550] px-4 py-2 text-sm font-semibold text-[#B89550] transition hover:bg-[#B89550] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18334D]">
          View Trip <span aria-hidden>→</span>
        </Link>
        <details className="relative">
          <summary aria-label={`More actions for ${t.title}`} className="flex h-9 w-9 cursor-pointer list-none items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B89550] [&::-webkit-details-marker]:hidden">
            <span aria-hidden className="text-xl leading-none">⋮</span>
          </summary>
          <div className="absolute right-0 z-20 mt-1 w-44 rounded-xl border border-stone-200 bg-white py-1 text-sm shadow-lg">
            <Link href={href} className="block px-4 py-2 text-stone-700 hover:bg-stone-50">View Booking</Link>
            <Link href="/contact" className="block px-4 py-2 text-stone-700 hover:bg-stone-50">Contact Support</Link>
          </div>
        </details>
      </div>
    </li>
  );
}

export default function UpcomingTrips({ trips }: { trips: TripRow[] }) {
  return (
    <section aria-labelledby="upcoming-trips-title">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="upcoming-trips-title" className="font-display text-xl font-bold text-[#18334D]">Upcoming Trips</h2>
        <Link href="#upcoming-trips" className="text-sm font-semibold text-[#B89550] hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#B89550]">
          View All Trips <span aria-hidden>→</span>
        </Link>
      </div>
      {trips.length === 0 ? (
        <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
          <h3 className="font-display text-lg font-semibold text-[#18334D]">No Upcoming Trips</h3>
          <p className="mt-1 text-sm text-stone-500">Your next adventure through Bhutan is waiting.</p>
          <Link href="/packages" className="mt-4 inline-block rounded-xl bg-[#B89550] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#18334D]">
            Explore Tours <span aria-hidden>→</span>
          </Link>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 rounded-2xl border border-stone-200 bg-white shadow-sm">
          {trips.map((t) => <Row key={t.id} t={t} />)}
        </ul>
      )}
    </section>
  );
}
