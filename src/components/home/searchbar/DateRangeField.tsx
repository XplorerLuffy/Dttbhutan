"use client";

import { useRef, useState } from "react";
import { useClickOutside } from "@/lib/hooks/useClickOutside";
import { getMonthMatrix, isSameDay, monthLabel, toDateInputValue, formatShort } from "@/lib/calendar";

/**
 * Booking.com-style date-range field: a button showing "Check-in —
 * Check-out" that opens a two-month calendar. First click sets
 * check-in, second click (on a later date) sets check-out and closes.
 */
export default function DateRangeField({
  checkInName = "startDate",
  checkOutName = "endDate",
}: {
  checkInName?: string;
  checkOutName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false));

  function handlePick(d: Date) {
    if (!checkIn || (checkIn && checkOut)) {
      setCheckIn(d);
      setCheckOut(null);
      return;
    }
    if (d <= checkIn) {
      setCheckIn(d);
      setCheckOut(null);
      return;
    }
    setCheckOut(d);
    setOpen(false);
  }

  function nextMonth() {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  }
  function prevMonth() {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  }

  const label = checkIn
    ? `${formatShort(checkIn)}${checkOut ? ` — ${formatShort(checkOut)}` : ""}`
    : "Add dates";

  return (
    <div ref={wrapRef} className="relative flex-1">
      <input type="hidden" name={checkInName} value={checkIn ? toDateInputValue(checkIn) : ""} />
      <input type="hidden" name={checkOutName} value={checkOut ? toDateInputValue(checkOut) : ""} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-md border-2 border-gold-400 bg-white px-4 py-3 text-left"
      >
        <IconCalendar className="h-5 w-5 shrink-0 text-stone-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-stone-500">Select dates</span>
          <span className="block truncate text-sm font-medium text-stone-900">{label}</span>
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-[calc(100vw-2rem)] max-w-[640px] rounded-lg border border-stone-200 bg-white p-4 shadow-xl">
          <div className="mb-3 flex items-center justify-between">
            <button type="button" onClick={prevMonth} className="rounded-full p-1 hover:bg-stone-100" aria-label="Previous month">
              ←
            </button>
            <p className="text-sm font-semibold text-stone-800">Pick check-in and check-out dates</p>
            <button type="button" onClick={nextMonth} className="rounded-full p-1 hover:bg-stone-100" aria-label="Next month">
              →
            </button>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <MonthGrid
              year={viewYear}
              month={viewMonth}
              today={today}
              checkIn={checkIn}
              checkOut={checkOut}
              onPick={handlePick}
            />
            <div className="hidden sm:block">
              <MonthGrid
                year={viewMonth === 11 ? viewYear + 1 : viewYear}
                month={viewMonth === 11 ? 0 : viewMonth + 1}
                today={today}
                checkIn={checkIn}
                checkOut={checkOut}
                onPick={handlePick}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MonthGrid({
  year,
  month,
  today,
  checkIn,
  checkOut,
  onPick,
}: {
  year: number;
  month: number;
  today: Date;
  checkIn: Date | null;
  checkOut: Date | null;
  onPick: (d: Date) => void;
}) {
  const weeks = getMonthMatrix(year, month);
  return (
    <div>
      <p className="mb-2 text-center text-sm font-semibold text-stone-700">{monthLabel(year, month)}</p>
      <div className="grid grid-cols-7 gap-1 text-center text-xs text-stone-400">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d}>{d}</span>
        ))}
      </div>
      {weeks.map((week, wi) => (
        <div key={wi} className="grid grid-cols-7 gap-1">
          {week.map((d, di) => {
            if (!d) return <span key={di} />;
            const past = d < today;
            const isStart = checkIn && isSameDay(d, checkIn);
            const isEnd = checkOut && isSameDay(d, checkOut);
            const inRange = checkIn && checkOut && d > checkIn && d < checkOut;
            return (
              <button
                key={di}
                type="button"
                disabled={past}
                onClick={() => onPick(d)}
                className={`rounded-md py-1.5 text-sm ${
                  past
                    ? "cursor-not-allowed text-stone-300"
                    : isStart || isEnd
                      ? "bg-brand-700 font-semibold text-white"
                      : inRange
                        ? "bg-brand-50 text-brand-800"
                        : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                {d.getDate()}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function IconCalendar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3 9h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
