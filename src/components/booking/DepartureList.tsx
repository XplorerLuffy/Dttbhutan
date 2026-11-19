"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import Money from "@/components/Money";
import ItineraryRequestDrawer, { type DrawerDeparture } from "@/components/listing/ItineraryRequestDrawer";
import GuestsRoomsDrawer from "@/components/booking/GuestsRoomsDrawer";
import { bookDeparture } from "@/lib/bookDeparture";
import { defaultRooms, totals, type Room } from "@/lib/guestRooms";

/**
 * Scheduled departures for one package: a year/month filter over a list of
 * expandable date rows, alongside a "private dates" alternative.
 *
 * "Book Now" creates a pending booking (see BookPanel) and needs a traveler
 * account, with the way back to the date kept through login and sign-up.
 * "Hold your spot" is the lighter step: it goes to the contact form rather
 * than the booking form, for someone who only wants to ask. The departure id
 * rides along in that link so the enquiry is tied to the real departure
 * rather than parsed out of a subject line someone could edit.
 *
 * Each row opens to show its price and any note, rather than putting them
 * all on the closed row: a column of near-identical prices is noise, and
 * the thing people scan a date list for is the dates.
 *
 * Dates are formatted from the ISO strings the server sent, in UTC-safe
 * fashion — the column is a DATE, so a departure on the 4th must not render
 * as the 3rd for a visitor west of Greenwich.
 */

export type StayView = { label: string; name: string; location: string | null; photoUrl: string | null };

export type DepartureView = {
  id: string;
  startDate: string;
  endDate: string;
  price: number;
  status: "OPEN" | "LIMITED" | "SOLD_OUT" | "CANCELLED";
  note: string | null;
};

const STATUS_LABEL: Record<DepartureView["status"], string> = {
  OPEN: "Available",
  LIMITED: "Limited space",
  SOLD_OUT: "Sold out",
  CANCELLED: "Cancelled",
};

const STATUS_CLASS: Record<DepartureView["status"], string> = {
  OPEN: "text-green-700",
  LIMITED: "text-amber-700",
  SOLD_OUT: "text-stone-400",
  CANCELLED: "text-stone-400",
};

/** What a party of this size reads as in a subject line or a summary bar. */
function partyLabel(adults: number, rooms: number) {
  return `${adults} adult${adults === 1 ? "" : "s"}, ${rooms} room${rooms === 1 ? "" : "s"}`;
}

/** A departure note this short is shown as a badge on the row; a longer one gets its own banner. */
const BADGE_MAX = 32;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Tab = "scheduled" | "private";

export default function DepartureList({
  departures,
  packageTitle,
  slug,
  itineraryId,
  drawerDepartures,
  stays,
  phone,
  tripImage,
  maxTravelers,
}: {
  departures: DepartureView[];
  packageTitle: string;
  slug: string;
  itineraryId: string;
  drawerDepartures: DrawerDeparture[];
  stays: StayView[];
  phone: string;
  tripImage: string | null;
  maxTravelers: number | null;
}) {
  const [tab, setTab] = useState<Tab>("scheduled");
  const [adults, setAdults] = useState(2);
  const [rooms, setRooms] = useState(1);
  /** "" until chosen — a private trip can't be quoted without it. */
  const [groupSize, setGroupSize] = useState("");

  const years = useMemo(
    () => Array.from(new Set(departures.map((d) => d.startDate.slice(0, 4)))).sort(),
    [departures]
  );
  const [year, setYear] = useState(years[0] ?? "");
  const [month, setMonth] = useState<string>("all");

  // The guests-and-rooms panel. `drawerDep` stays set after closing so the panel
  // can slide out, and so reopening the same departure keeps its room choices.
  const [roomsConfig, setRoomsConfig] = useState<Room[]>(() => defaultRooms(2, 1));
  const [drawerDep, setDrawerDep] = useState<DepartureView | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  function openDrawer(d: DepartureView) {
    // The bar above the list can change the party without the panel knowing;
    // when it has, start from what the bar says.
    const t = totals(roomsConfig);
    if (t.travelers !== adults || t.rooms !== rooms) setRoomsConfig(defaultRooms(adults, rooms));
    setDrawerDep(d);
    setDrawerOpen(true);
  }

  /** A departure to open on arrival: where "Book Now" returns after logging in. */
  const [preselect, setPreselect] = useState<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const id = q.get("departure");
    const wanted = id ? departures.find((d) => d.id === id) : undefined;
    if (!wanted) return;
    const a = Number(q.get("adults"));
    const r = Number(q.get("rooms"));
    if (Number.isInteger(a) && a >= 1 && a <= 30) {
      setAdults(a);
      if (Number.isInteger(r) && r >= 1 && r <= a) setRooms(r);
    }
    setYear(wanted.startDate.slice(0, 4));
    setMonth("all");
    setPreselect(wanted.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const inYear = departures.filter((d) => d.startDate.startsWith(year));
  const monthsInYear = useMemo(
    () => Array.from(new Set(inYear.map((d) => d.startDate.slice(5, 7)))).sort(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [year, departures]
  );
  const shown = month === "all" ? inYear : inYear.filter((d) => d.startDate.slice(5, 7) === month);

  return (
    <div>
      <div className="flex rounded-full bg-stone-100 p-1.5" role="tablist">
        <TabButton active={tab === "scheduled"} onClick={() => setTab("scheduled")}>
          Scheduled Dates
        </TabButton>
        <TabButton active={tab === "private"} onClick={() => setTab("private")}>
          Private Dates
        </TabButton>
      </div>

      {tab === "private" ? (
        <>
          <GroupSizeBar groupSize={groupSize} onChange={setGroupSize} />

          {departures.length > 0 && (
            <DateFilter
              years={years}
              year={year}
              month={month}
              monthsInYear={monthsInYear}
              onYear={(y) => {
                setYear(y);
                setMonth("all");
              }}
              onMonth={setMonth}
            />
          )}

          {shown.length > 0 && (
            <ul className="mt-5 space-y-3">
              {shown.map((d) => (
                <DepartureRow
                  key={d.id}
                  departure={d}
                  packageTitle={packageTitle}
                  mode="private"
                  groupSize={groupSize}
                  adults={adults}
                  rooms={rooms}
                />
              ))}
            </ul>
          )}

          <NotFindingTheRightFit packageTitle={packageTitle} />
        </>
      ) : departures.length === 0 ? (
        <p className="mt-6 text-stone-600">
          No scheduled departures are published for this tour yet — private dates are available.
        </p>
      ) : (
        <>
          <p className="mt-5 max-w-3xl text-stone-700">
            Open a date to see its price and any variation on the itinerary. Prices are per person,
            sharing a twin room.
          </p>

          <DateFilter
            years={years}
            year={year}
            month={month}
            monthsInYear={monthsInYear}
            onYear={(y) => {
              setYear(y);
              setMonth("all");
            }}
            onMonth={setMonth}
          />

          <GuestSelector
            adults={adults}
            rooms={rooms}
            // Dropping the party below the number of rooms would leave an
            // empty room in the enquiry, so the rooms follow it down.
            onAdults={(n) => {
              setAdults(n);
              setRooms((r) => Math.min(r, n));
            }}
            onRooms={setRooms}
          />

          <ul className="mt-5 space-y-3">
            {shown.map((d) => (
              <DepartureRow
                key={d.id}
                departure={d}
                packageTitle={packageTitle}
                adults={adults}
                rooms={rooms}
                slug={slug}
                itineraryId={itineraryId}
                drawerDepartures={drawerDepartures}
                stays={stays}
                phone={phone}
                onBookTrip={() => openDrawer(d)}
                openOnArrival={preselect === d.id}
              />
            ))}
          </ul>

          {shown.length === 0 && (
            <p className="mt-6 text-sm text-stone-600">
              No departures in that month. Try another, or{" "}
              <button
                type="button"
                onClick={() => setTab("private")}
                className="font-semibold text-brand-700 hover:underline"
              >
                ask us for dates that suit you
              </button>
              .
            </p>
          )}
        </>
      )}

      {drawerDep && (
        <GuestsRoomsDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          rooms={roomsConfig}
          onRooms={setRoomsConfig}
          onContinue={(r) => {
            // Make the bar above the list, and Book Now, agree with the choice.
            const t = totals(r);
            setAdults(t.travelers);
            setRooms(t.rooms);
          }}
          tripTitle={packageTitle}
          tripImage={tripImage}
          slug={slug}
          itineraryId={itineraryId}
          departure={drawerDep}
          maxTravelers={maxTravelers}
        />
      )}
    </div>
  );
}

function DepartureRow({
  departure: d,
  packageTitle,
  adults,
  rooms,
  mode = "scheduled",
  groupSize = "",
  slug,
  itineraryId,
  drawerDepartures,
  stays = [],
  phone = "",
  onBookTrip,
  openOnArrival = false,
}: {
  departure: DepartureView;
  packageTitle: string;
  adults: number;
  rooms: number;
  mode?: Tab;
  groupSize?: string;
  slug?: string;
  itineraryId?: string;
  drawerDepartures?: DrawerDeparture[];
  stays?: StayView[];
  phone?: string;
  onBookTrip?: () => void;
  openOnArrival?: boolean;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (openOnArrival) setOpen(true);
  }, [openOnArrival]);
  const isPrivate = mode === "private";
  // A private trip runs for one group alone, so it is never "sold out" the
  // way a shared departure is — the status only governs the shared list.
  const bookable = isPrivate ? true : d.status === "OPEN" || d.status === "LIMITED";
  const statusLabel = STATUS_LABEL[d.status];
  const party = isPrivate ? `a group of ${groupSize}` : partyLabel(adults, rooms);

  const subject = isPrivate
    ? `Private departure request: ${packageTitle} — ${fmtLong(d.startDate)}`
    : `Booking request: ${packageTitle} — ${fmtLong(d.startDate)} to ${fmtLong(d.endDate)}`;
  // The party rides in the message rather than the subject: a subject long
  // enough to carry both gets truncated in every mail client.
  const message = isPrivate
    ? `I'd like a quote to run ${packageTitle} privately, starting ${fmtLong(d.startDate)}, for ${party}.`
    : `I'd like to request places on the ${fmtLong(d.startDate)} departure for ${party}.`;
  const bookHref = `/contact?subject=${encodeURIComponent(subject)}&departure=${d.id}&message=${encodeURIComponent(message)}`;
  const panelId = `departure-${d.id}-${mode}`;

  return (
    <li
      className={`overflow-hidden rounded-md bg-white ${
        open && !isPrivate ? "ring-1 ring-brand-900" : "shadow-[0_1px_4px_rgba(0,0,0,0.18)]"
      }`}
    >
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 px-5 py-4">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-5 gap-y-2">
          <DateBlock iso={d.startDate} />
          <svg aria-hidden viewBox="0 0 20 20" className="h-5 w-5 shrink-0 text-stone-900">
            <path d="m7 3 7 7-7 7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <DateBlock iso={d.endDate} />
          {!isPrivate && d.note && d.note.length <= BADGE_MAX && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-stone-300 bg-stone-50 px-2.5 py-1 text-sm text-stone-900">
              <BedIcon />
              {d.note}
            </span>
          )}
        </div>

        {isPrivate ? (
          <span
            className={`shrink-0 text-sm font-semibold ${
              groupSize ? "text-stone-600" : "text-rose-600"
            }`}
          >
            {groupSize ? "Priced on request" : "Select a group size for pricing"}
          </span>
        ) : (
          <span className={`shrink-0 text-sm font-bold ${STATUS_CLASS[d.status]}`}>{statusLabel}</span>
        )}

        {!isPrivate && bookable && onBookTrip && (
          <div className="order-last flex w-full items-center justify-between gap-4 sm:order-none sm:w-auto">
            <p className="text-sm leading-tight text-stone-700">
              From <strong className="text-base text-stone-900"><Money btn={d.price} /></strong>
              <span className="block">per person</span>
            </p>
            <button
              type="button"
              onClick={onBookTrip}
              aria-label={`Book this trip: ${fmtLong(d.startDate)} to ${fmtLong(d.endDate)}`}
              className="inline-flex items-center gap-2 rounded-lg border-2 border-gold-600 bg-white px-4 py-2 text-sm font-bold text-gold-700 transition-colors hover:bg-gold-500 hover:text-white"
            >
              Book This Trip
              <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={panelId}
          className="shrink-0 rounded-full p-1 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-700"
        >
          <span className="sr-only">
            {open ? "Hide details for" : "Show details for"} {fmtLong(d.startDate)}
          </span>
          <svg
            aria-hidden
            viewBox="0 0 20 20"
            className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`}
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {open && !isPrivate && slug && itineraryId && drawerDepartures && (
        <BookPanel
          id={panelId}
          departure={d}
          slug={slug}
          itineraryId={itineraryId}
          packageTitle={packageTitle}
          adults={adults}
          rooms={rooms}
          bookable={bookable}
          holdHref={bookHref}
          drawerDepartures={drawerDepartures}
          stays={stays}
          phone={phone}
        />
      )}

      {open && !(!isPrivate && slug && itineraryId && drawerDepartures) && (
        <div id={panelId} className="border-t border-stone-100 bg-stone-50/60 px-5 py-4">
          <dl className="flex flex-wrap gap-x-10 gap-y-3">
            {/* The scheduled per-person price is deliberately absent in private
                mode. It is the price of sharing a fixed departure, and quoting
                it for a trip run for one group alone would be a number nobody
                has agreed to — the team prices these individually. */}
            {isPrivate ? (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  Price
                </dt>
                <dd className="font-semibold text-stone-900">
                  Quoted for your group — it varies with size and season
                </dd>
              </div>
            ) : (
              <>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Price
                  </dt>
                  <dd className="font-display text-lg font-bold text-brand-800">
                    <Money btn={d.price} />
                    <span className="ml-1 text-sm font-medium text-stone-500">/person</span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                    Availability
                  </dt>
                  <dd className="font-semibold text-stone-900">
                    {statusLabel ?? "Places available"}
                  </dd>
                </div>
              </>
            )}
            {d.note && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  This departure
                </dt>
                <dd className="text-stone-800">{d.note}</dd>
              </div>
            )}
          </dl>

          <div className="mt-4 flex flex-wrap items-center gap-4">
            {isPrivate && !groupSize ? (
              // Sending the enquiry without a group size would produce a
              // message the team can't quote from, so the button waits.
              <p className="text-sm font-semibold text-rose-600">
                Choose an approximate group size above to request this date.
              </p>
            ) : bookable ? (
              <Link
                href={bookHref}
                className="rounded-full bg-brand-800 px-6 py-2.5 font-semibold text-white transition-colors hover:bg-brand-900"
              >
                {isPrivate ? "Request this date" : "Request to Book"}
              </Link>
            ) : (
              <span className="text-sm text-stone-500">
                This departure is closed — try another date, or ask us about private dates.
              </span>
            )}
            {bookable && (!isPrivate || groupSize) && (
              <p className="text-sm text-stone-500">
                For {party}. Nothing is charged at this stage.
              </p>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

/** Bands rather than an exact head count: at this stage nobody has a final
 * list, and a band is enough for the team to price against. */
const GROUP_SIZES = ["2", "3–4", "5–6", "7–8", "9–12", "13 or more"];

/**
 * The group-size gate above the private date list.
 *
 * A private trip's price moves with how many people share the guide, the
 * vehicle and the rooms, so the size comes first and every date below stays
 * unpriced until it is set. Marked required, and outlined in red while
 * empty, because the alternative is an enquiry the team has to reply to
 * with a question instead of a price.
 */
function GroupSizeBar({
  groupSize,
  onChange,
}: {
  groupSize: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="mt-6 rounded-lg border border-brand-100 bg-brand-50 px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <p className="text-stone-800">
          Pricing varies with your departure date and the size of your group.
        </p>

        {/* Label and control travel together, so the pair wraps as one block
            instead of the label stranding itself on the line above. */}
        <div className="ml-auto flex items-center gap-3">
          <label htmlFor="group-size" className="text-sm font-semibold text-stone-900">
            Approx. group size <span className="text-rose-600">*</span>
          </label>
          <select
            id="group-size"
            value={groupSize}
            onChange={(e) => onChange(e.target.value)}
            required
            className={`rounded-md border-2 bg-white px-4 py-2 font-medium text-stone-900 ${
              groupSize ? "border-stone-300" : "border-rose-400"
            }`}
          >
            <option value="">Select</option>
            {GROUP_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

/** Year pills and month chips. Shared so the two tabs filter identically —
 * they are the same calendar, seen two ways. */
function DateFilter({
  years,
  year,
  month,
  monthsInYear,
  onYear,
  onMonth,
}: {
  years: string[];
  year: string;
  month: string;
  monthsInYear: string[];
  onYear: (y: string) => void;
  onMonth: (m: string) => void;
}) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      {years.length > 1 && (
        <div className="inline-flex rounded-full bg-stone-100 p-1">
          {years.map((y) => (
            <button
              key={y}
              type="button"
              onClick={() => onYear(y)}
              aria-pressed={y === year}
              className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
                y === year ? "bg-white text-brand-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Chip active={month === "all"} onClick={() => onMonth("all")}>
          All
        </Chip>
        {monthsInYear.map((m) => (
          <Chip key={m} active={month === m} onClick={() => onMonth(m)}>
            {MONTHS[Number(m) - 1]}
          </Chip>
        ))}
      </div>
    </div>
  );
}

/**
 * The way out of the list. The dates above are the ones already on the
 * calendar; a private group is not bound by them, so the page has to say so
 * rather than leaving someone to conclude their month is impossible.
 */
function NotFindingTheRightFit({ packageTitle }: { packageTitle: string }) {
  return (
    <div className="mt-6 rounded-xl border border-stone-200 bg-white px-6 py-6 text-center">
      <h3 className="font-display text-lg font-semibold text-stone-900">
        Not finding the right fit?
      </h3>
      <p className="mx-auto mt-2 max-w-2xl text-stone-700">
        These are the start dates already on our calendar. A private trip can run on dates of your
        own — tell us roughly when you want to travel and we&apos;ll build it around you.
      </p>
      <Link
        href={`/custom-tour?trip=${encodeURIComponent(packageTitle)}`}
        className="mt-5 inline-block rounded-full bg-brand-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
      >
        Request your own dates
      </Link>
    </div>
  );
}

/**
 * Party size for the whole date list, the way an outfitter's dates page
 * carries it: set once above the dates rather than asked again on every
 * row. It rides into the enquiry so the reply can quote the right price,
 * and is shown as a summary until someone opens it — the common case is
 * two adults in one room, and making everyone step through a form to
 * confirm that is a tax on the majority.
 */
function GuestSelector({
  adults,
  rooms,
  onAdults,
  onRooms,
}: {
  adults: number;
  rooms: number;
  onAdults: (n: number) => void;
  onRooms: (n: number) => void;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="mt-5 rounded-lg border border-brand-100 bg-brand-50 px-5 py-4">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wider text-brand-900">
          Your guest &amp; room selections
        </p>
        <p className="flex items-center gap-2 text-stone-800">
          <PersonIcon />
          {adults} adult{adults === 1 ? "" : "s"}
        </p>
        <p className="flex items-center gap-2 text-stone-800">
          <BedIcon />
          {rooms} room{rooms === 1 ? "" : "s"}
        </p>
        <button
          type="button"
          onClick={() => setEditing((e) => !e)}
          aria-expanded={editing}
          className="ml-auto font-semibold text-brand-700 underline underline-offset-2 hover:text-brand-900"
        >
          {editing ? "Done" : "Edit"}
        </button>
      </div>

      {editing && (
        <div className="mt-4 flex flex-wrap gap-8 border-t border-brand-100 pt-4">
          <Stepper label="Adults" value={adults} min={1} max={30} onChange={onAdults} />
          <Stepper label="Rooms" value={rooms} min={1} max={adults} onChange={onRooms} />
        </div>
      )}
    </div>
  );
}

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function PersonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 text-brand-700" {...ICON}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="2.6" />
      <path d="M6.8 18.6a5.6 5.6 0 0 1 10.4 0" />
    </svg>
  );
}

function BedIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5 text-brand-700" {...ICON}>
      <path d="M3 18v-7M3 14h18v4M21 18v-4" />
      <path d="M6.5 11V8.5h11V11" />
    </svg>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <p id={`stepper-${label}`} className="mb-1 text-sm font-medium text-stone-700">
        {label}
      </p>
      <div className="flex items-center gap-3">
        <StepButton
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          label={`One fewer ${label.toLowerCase().replace(/s$/, "")}`}
        >
          −
        </StepButton>
        <span aria-labelledby={`stepper-${label}`} className="w-6 text-center font-semibold">
          {value}
        </span>
        <StepButton
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          label={`One more ${label.toLowerCase().replace(/s$/, "")}`}
        >
          +
        </StepButton>
      </div>
    </div>
  );
}

function StepButton({
  onClick,
  disabled,
  label,
  children,
}: {
  onClick: () => void;
  disabled: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="h-8 w-8 rounded-full border border-stone-300 bg-white text-lg leading-none text-stone-700 transition-colors hover:border-brand-700 hover:text-brand-800 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-stone-300 disabled:hover:text-stone-700"
    >
      {children}
    </button>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex-1 rounded-full px-6 py-3 font-display text-base font-semibold transition-colors ${
        active ? "bg-white text-brand-900 shadow-sm" : "text-stone-600 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${
        active
          ? "border-brand-800 bg-white text-brand-900"
          : "border-transparent bg-stone-100 text-stone-600 hover:text-stone-900"
      }`}
    >
      {children}
    </button>
  );
}

function DateBlock({ iso }: { iso: string }) {
  const d = parseISO(iso);
  return (
    <span className="block text-center">
      <span className="block font-display text-xl font-bold leading-tight text-stone-900">{format(d, "MMM d")}</span>
      <span className="block text-sm font-medium text-stone-500">{format(d, "EEEE")}</span>
    </span>
  );
}

function fmtLong(iso: string) {
  return format(parseISO(iso), "d MMMM yyyy");
}

const DAY_MS = 86_400_000;
const utcDay = (iso: string) => Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10));

/**
 * The trip's days on a week-by-week calendar: the days of the trip are filled
 * in, the rest of those weeks are outlined, so the length of the trip reads at
 * a glance.
 */
function TripCalendar({ startIso, endIso }: { startIso: string; endIso: string }) {
  const start = utcDay(startIso);
  const end = utcDay(endIso);
  const days = Math.round((end - start) / DAY_MS) + 1;
  const first = start - new Date(start).getUTCDay() * DAY_MS;
  const last = end + (6 - new Date(end).getUTCDay()) * DAY_MS;
  const cells: number[] = [];
  for (let t = first; t <= last; t += DAY_MS) cells.push(t);

  return (
    <div>
      <p className="mb-3 text-base font-bold text-stone-900">
        {days} Days &bull; {Math.max(0, days - 1)} Nights
      </p>
      <div className="grid w-[12.5rem] grid-cols-7 gap-1 text-center" aria-hidden>
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <span key={i} className="pb-0.5 text-sm font-semibold text-stone-900">
            {d}
          </span>
        ))}
        {cells.map((t) => {
          const inTrip = t >= start && t <= end;
          return (
            <span
              key={t}
              className={`flex h-6 items-center justify-center rounded-[3px] border text-[13px] ${
                inTrip ? "border-brand-900 bg-brand-900 font-bold text-white" : "border-stone-300 text-stone-400"
              }`}
            >
              {new Date(t).getUTCDate()}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MapPinIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-brand-900" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6.5 8.5 4l7 2.5L21 4v13.5L15.5 20l-7-2.5L3 20V6.5Z" />
      <path d="M8.5 4v13.5M15.5 6.5V20" />
      <path d="M12 12.2s-2.2-1.9-2.2-3.6a2.2 2.2 0 1 1 4.4 0c0 1.7-2.2 3.6-2.2 3.6Z" fill="currentColor" stroke="none" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="10" cy="10" r="8" />
      <path d="M10 9v5M10 6.2v.1" strokeLinecap="round" />
    </svg>
  );
}

/**
 * The open row for a scheduled departure, laid out like Backroads': a banner
 * for the departure's note, the trip's days beside the price, Book Now and
 * Hold your spot on the right, then where you stay, night by night.
 *
 * Book Now creates a pending booking that the agency then confirms and
 * invoices. It takes two presses on purpose: the first shows the party and
 * the total, the second creates the booking, so a stray click does not put one
 * in the agency's list. Nothing is charged here.
 */
function BookPanel({
  id,
  departure: d,
  slug,
  itineraryId,
  packageTitle,
  adults,
  rooms,
  bookable,
  holdHref,
  drawerDepartures,
  stays,
  phone,
}: {
  id: string;
  departure: DepartureView;
  slug: string;
  itineraryId: string;
  packageTitle: string;
  adults: number;
  rooms: number;
  bookable: boolean;
  holdHref: string;
  drawerDepartures: DrawerDeparture[];
  stays: StayView[];
  phone: string;
}) {
  const [step, setStep] = useState<"idle" | "confirm" | "sending" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  const [needsLogin, setNeedsLogin] = useState(false);
  const [booked, setBooked] = useState<{ id: string; reference: string } | null>(null);

  const party = partyLabel(adults, rooms);
  const next = `/packages/${slug}?departure=${d.id}&adults=${adults}&rooms=${rooms}#dates`;
  const nextQuery = encodeURIComponent(next);

  // The party changed under an open confirmation: ask again rather than book a different one.
  useEffect(() => {
    setStep((s) => (s === "confirm" ? "idle" : s));
  }, [adults, rooms]);

  async function book() {
    setStep("sending");
    setError(null);
    setNeedsLogin(false);
    const result = await bookDeparture({
      itineraryId,
      departureId: d.id,
      startDate: d.startDate,
      travelers: adults,
      rooms,
    });
    if (result.kind === "ok") {
      setBooked({ id: result.id, reference: result.reference });
      setStep("done");
    } else if (result.kind === "login") {
      setNeedsLogin(true);
      setStep("idle");
    } else {
      setError(result.message);
      setStep("idle");
    }
  }

  return (
    <div id={id} className="border-t border-stone-300">
      {d.note && d.note.length > BADGE_MAX && (
        <p className="bg-[#d9eed9] px-5 py-3 text-sm text-stone-900">{d.note}</p>
      )}

      <div className="flex flex-wrap items-start justify-between gap-x-10 gap-y-6 px-5 py-7">
        <div className="flex flex-wrap items-start gap-x-16 gap-y-6">
          <TripCalendar startIso={d.startDate} endIso={d.endDate} />
          <div>
            <p className="text-stone-900">
              <span className="font-display text-3xl font-bold">
                <Money btn={d.price} />
              </span>
              <span className="text-xl">/person</span>
            </p>
            <p className="mt-1 text-sm text-stone-700">
              {party} &middot; <Money btn={d.price * adults} /> in total
            </p>
            <div className="mt-4 flex items-center gap-2">
              <MapPinIcon />
              <ItineraryRequestDrawer
                slug={slug}
                tripTitle={packageTitle}
                departures={drawerDepartures}
                initialDepartureId={d.id}
                triggerLabel="Detailed Itinerary"
                triggerClassName="text-base font-semibold text-brand-900 underline underline-offset-2 hover:text-brand-700"
              />
            </div>
          </div>
        </div>

        <div className="flex min-w-[13rem] flex-col items-stretch gap-4 sm:items-center">
          {step === "done" && booked ? null : bookable ? (
            step === "confirm" || step === "sending" ? (
              <div className="rounded-lg border border-brand-200 bg-brand-50 p-4 text-sm sm:text-center">
                <p className="font-semibold text-stone-900">
                  Book {party} for <Money btn={d.price * adults} />?
                </p>
                <p className="mt-0.5 text-xs text-stone-600">Nothing is charged now. We confirm, then arrange payment.</p>
                <div className="mt-3 flex gap-2 sm:justify-center">
                  <button
                    type="button"
                    onClick={book}
                    disabled={step === "sending"}
                    className="rounded-full bg-brand-900 px-6 py-2.5 text-sm font-bold text-white hover:bg-brand-800 disabled:opacity-60"
                  >
                    {step === "sending" ? "Booking…" : "Confirm booking"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("idle")}
                    disabled={step === "sending"}
                    className="rounded-full px-3 py-2.5 text-sm font-medium text-stone-600 hover:bg-white"
                  >
                    Back
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setStep("confirm")}
                className="rounded-full bg-brand-900 px-14 py-5 text-xl font-bold text-white transition-colors hover:bg-brand-800"
              >
                Book Now
              </button>
            )
          ) : (
            <span className="text-sm text-stone-500">This departure is closed — try another date.</span>
          )}

          {bookable && step !== "done" && (
            <Link
              href={holdHref}
              title="Ask us to hold a place for you. Nothing is booked or charged."
              className="inline-flex items-center justify-center gap-1.5 text-base font-semibold text-brand-900 underline underline-offset-2 hover:text-brand-700"
            >
              Hold your spot
              <InfoIcon />
            </Link>
          )}
        </div>
      </div>

      <div aria-live="polite" className="px-5 pb-5 empty:hidden">
        {needsLogin && (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Please{" "}
            <Link href={`/login?next=${nextQuery}`} className="font-semibold underline">
              log in
            </Link>{" "}
            or{" "}
            <Link href={`/register?next=${nextQuery}`} className="font-semibold underline">
              create a free account
            </Link>{" "}
            to book. You&apos;ll come straight back to this date.
          </p>
        )}
        {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
        {step === "done" && booked && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <p className="font-semibold">Booking requested &middot; reference {booked.reference}</p>
            <p className="mt-0.5">
              We&apos;ll confirm availability and the final price by email, then arrange payment. Nothing has been charged.{" "}
              <Link href={`/dashboard/bookings/${booked.id}`} className="font-semibold underline">
                View it in My trips →
              </Link>
            </p>
          </div>
        )}
      </div>

      {stays.length > 0 && (
        <>
          <p className="border-t border-stone-300 bg-[#fdecc4] px-5 py-4 text-sm text-stone-900">
            <strong>Hotels are as planned for this trip. We confirm the exact hotels for your dates in writing before you pay anything.</strong>{" "}
            Download a Detailed Itinerary{phone ? <> or call us at <a href={`tel:${phone.replace(/[^+\d]/g, "")}`} className="font-semibold underline">{phone}</a></> : null} to learn more.
          </p>
          <ul className="space-y-6 px-5 py-6">
            {stays.map((s, i) => (
              <li key={`${s.label}-${i}`} className="flex flex-wrap items-center gap-x-8 gap-y-3">
                <div className="relative h-[8.5rem] w-[13.75rem] shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-brand-600 to-brand-950">
                  {s.photoUrl && <Image src={s.photoUrl} alt={s.name} fill unoptimized sizes="220px" className="object-cover" />}
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-stone-900">{s.label}</p>
                  <p className="mt-1 font-display text-xl text-stone-900">{s.name}</p>
                  {s.location && <p className="mt-0.5 text-base text-stone-700">{s.location}</p>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
