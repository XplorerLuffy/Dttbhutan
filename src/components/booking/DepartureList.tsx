"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import Money from "@/components/Money";

/**
 * Scheduled departures for one package, filterable by year and month.
 *
 * "Request to book" goes to the contact form rather than the booking form
 * on purpose: at this point the traveller is asking to hold a place on a
 * set date, and making a stranger create an account before they can ask is
 * a good way to lose them. The departure id rides along in the link so the
 * enquiry is tied to the real departure rather than parsed out of a subject
 * line someone could edit.
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

export default function DepartureList({
  departures,
  packageTitle,
}: {
  departures: DepartureView[];
  packageTitle: string;
}) {
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

  if (departures.length === 0) return null;

  return (
    <div>
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
                y === year ? "bg-white text-brand-800 shadow-sm" : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <Chip active={month === "all"} onClick={() => setMonth("all")}>
          All
        </Chip>
        {monthsInYear.map((m) => (
          <Chip key={m} active={month === m} onClick={() => setMonth(m)}>
            {MONTHS[Number(m) - 1]}
          </Chip>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {shown.map((d) => {
          const bookable = d.status === "OPEN" || d.status === "LIMITED";
          const statusLabel = STATUS_LABEL[d.status];
          const subject = `Booking request: ${packageTitle} — ${fmtLong(d.startDate)} to ${fmtLong(d.endDate)}`;

          return (
            <li
              key={d.id}
              className="flex flex-col gap-4 rounded-lg border border-stone-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex items-center gap-4">
                <DateBlock iso={d.startDate} />
                <span aria-hidden className="text-stone-300">
                  →
                </span>
                <DateBlock iso={d.endDate} />
              </div>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 sm:justify-end">
                {d.note && <span className="text-sm text-stone-500">{d.note}</span>}
                {statusLabel && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      d.status === "LIMITED" ? "bg-amber-100 text-amber-900" : "bg-stone-200 text-stone-600"
                    }`}
                  >
                    {statusLabel}
                  </span>
                )}
                <span className="text-sm text-stone-600">
                  <Money btn={d.price} />
                  <span className="text-stone-400"> /person</span>
                </span>
                {bookable ? (
                  <Link
                    href={`/contact?subject=${encodeURIComponent(subject)}&departure=${d.id}`}
                    className="rounded-full bg-brand-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-800"
                  >
                    Request to book
                  </Link>
                ) : (
                  <span className="text-sm text-stone-400">Not available</span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      {shown.length === 0 && (
        <p className="mt-6 text-sm text-stone-600">
          No departures in that month. Try another, or{" "}
          <Link href="/custom-tour" className="text-brand-700 hover:underline">
            ask us for dates that suit you
          </Link>
          .
        </p>
      )}
    </div>
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
      className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "border-brand-700 bg-brand-700 text-white"
          : "border-stone-300 text-stone-700 hover:border-stone-400"
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
      <span className="block font-display text-lg font-semibold text-stone-900">
        {format(d, "d MMM")}
      </span>
      <span className="block text-xs text-stone-500">{format(d, "EEEE")}</span>
    </span>
  );
}

function fmtLong(iso: string) {
  return format(parseISO(iso), "d MMMM yyyy");
}
