"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import Money from "@/components/Money";

/**
 * Scheduled departures for one package: a year/month filter over a list of
 * expandable date rows, alongside a "private dates" alternative.
 *
 * "Request to book" goes to the contact form rather than the booking form
 * on purpose: at this point the traveller is asking to hold a place on a
 * set date, and making a stranger create an account before they can ask is
 * a good way to lose them. The departure id rides along in the link so the
 * enquiry is tied to the real departure rather than parsed out of a subject
 * line someone could edit.
 *
 * Each row opens to show its price and any note, rather than putting them
 * all on the closed row: a column of near-identical prices is noise, and
 * the thing people scan a date list for is the dates.
 *
 * Dates are formatted from the ISO strings the server sent, in UTC-safe
 * fashion — the column is a DATE, so a departure on the 4th must not render
 * as the 3rd for a visitor west of Greenwich.
 */

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
  OPEN: "text-pine-600",
  LIMITED: "text-amber-700",
  SOLD_OUT: "text-stone-400",
  CANCELLED: "text-stone-400",
};

/** What a party of this size reads as in a subject line or a summary bar. */
function partyLabel(adults: number, rooms: number) {
  return `${adults} adult${adults === 1 ? "" : "s"}, ${rooms} room${rooms === 1 ? "" : "s"}`;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

type Tab = "scheduled" | "private";

export default function DepartureList({
  departures,
  packageTitle,
}: {
  departures: DepartureView[];
  packageTitle: string;
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
}: {
  departure: DepartureView;
  packageTitle: string;
  adults: number;
  rooms: number;
  mode?: Tab;
  groupSize?: string;
}) {
  const [open, setOpen] = useState(false);
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
    <li className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="flex items-center gap-4 px-5 py-4">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <DateBlock iso={d.startDate} />
          <span aria-hidden className="text-stone-300">
            ›
          </span>
          <DateBlock iso={d.endDate} />
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
          <span className={`shrink-0 font-semibold ${STATUS_CLASS[d.status]}`}>{statusLabel}</span>
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

      {open && (
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
    <span className="block">
      <span className="block font-display text-lg font-bold text-stone-900">
        {format(d, "d MMM")}
      </span>
      <span className="block text-xs text-stone-500">{format(d, "EEEE")}</span>
    </span>
  );
}

function fmtLong(iso: string) {
  return format(parseISO(iso), "d MMMM yyyy");
}
