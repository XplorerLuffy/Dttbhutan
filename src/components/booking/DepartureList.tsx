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

const STATUS_LABEL: Record<DepartureView["status"], string | null> = {
  OPEN: null,
  LIMITED: "Limited space",
  SOLD_OUT: "Sold out",
  CANCELLED: "Cancelled",
};

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
        <div className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
          <h3 className="font-display text-lg font-semibold text-stone-900">
            Travel on your own dates
          </h3>
          <p className="mt-2 max-w-2xl text-stone-700">
            Any of our trips can run privately, for your group alone, on dates that suit you. Tell
            us roughly when you want to travel and how many of you there are, and we&apos;ll come
            back with a plan and a price.
          </p>
          <Link
            href={`/custom-tour?trip=${encodeURIComponent(packageTitle)}`}
            className="mt-5 inline-block rounded-full bg-brand-700 px-6 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
          >
            Request private dates
          </Link>
        </div>
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

          <div className="mt-5 flex flex-wrap items-center gap-3">
            {years.length > 1 && (
              <div className="inline-flex rounded-full bg-stone-100 p-1">
                {years.map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => {
                      setYear(y);
                      setMonth("all");
                    }}
                    aria-pressed={y === year}
                    className={`rounded-full px-5 py-1.5 text-sm font-semibold transition-colors ${
                      y === year
                        ? "bg-white text-brand-900 shadow-sm"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              <Chip active={month === "all"} onClick={() => setMonth("all")}>
                All
              </Chip>
              {monthsInYear.map((m) => (
                <Chip key={m} active={month === m} onClick={() => setMonth(m)}>
                  {MONTHS[Number(m) - 1]}
                </Chip>
              ))}
            </div>
          </div>

          <ul className="mt-6 space-y-3">
            {shown.map((d) => (
              <DepartureRow key={d.id} departure={d} packageTitle={packageTitle} />
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
}: {
  departure: DepartureView;
  packageTitle: string;
}) {
  const [open, setOpen] = useState(false);
  const bookable = d.status === "OPEN" || d.status === "LIMITED";
  const statusLabel = STATUS_LABEL[d.status];
  const subject = `Booking request: ${packageTitle} — ${fmtLong(d.startDate)} to ${fmtLong(d.endDate)}`;
  const panelId = `departure-${d.id}`;

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

        {statusLabel && (
          <span
            className={`hidden shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold sm:inline ${
              d.status === "LIMITED" ? "bg-amber-100 text-amber-900" : "bg-stone-200 text-stone-600"
            }`}
          >
            {statusLabel}
          </span>
        )}

        {bookable ? (
          <Link
            href={`/contact?subject=${encodeURIComponent(subject)}&departure=${d.id}`}
            className="shrink-0 font-semibold text-brand-700 hover:underline"
          >
            Request to Book
          </Link>
        ) : (
          <span className="shrink-0 text-sm text-stone-400">Not available</span>
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
              <dd className="font-semibold text-stone-900">{statusLabel ?? "Places available"}</dd>
            </div>
            {d.note && (
              <div>
                <dt className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                  This departure
                </dt>
                <dd className="text-stone-800">{d.note}</dd>
              </div>
            )}
          </dl>
        </div>
      )}
    </li>
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
