"use client";

import { useEffect, useState } from "react";
import {
  DAY_KEYS,
  DAY_LABELS,
  SCHEDULE_TIME_ZONE,
  SCHEDULE_ZONE_NOTE,
  describeDay,
  openStatus,
  type Schedule,
} from "@/lib/officeHours";

/**
 * The weekly hours as a table, today highlighted, with an "Open now" /
 * "Closed now" line worked out in Bhutan time — a visitor in another zone
 * would otherwise have to do that sum.
 *
 * The status and the highlighted day depend on the clock, so they are filled
 * in after the page loads; the server-rendered table is just the week.
 */
export default function OpeningHours({ schedule }: { schedule: Schedule }) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const status = now ? openStatus(schedule, now) : null;
  const today = now
    ? DAY_KEYS[
        ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(
          new Intl.DateTimeFormat("en-GB", { timeZone: SCHEDULE_TIME_ZONE, weekday: "short" }).format(now)
        )
      ]
    : null;

  return (
    <div>
      {status && status.note && (
        <p
          className={`mb-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            status.open ? "bg-emerald-50 text-emerald-800" : "bg-stone-100 text-stone-600"
          }`}
        >
          <span
            aria-hidden
            className={`h-2 w-2 rounded-full ${status.open ? "bg-emerald-500" : "bg-stone-400"}`}
          />
          {status.note}
        </p>
      )}
      <table className="w-full text-sm">
        <tbody>
          {DAY_KEYS.map((day) => {
            const isToday = day === today;
            const hours = schedule[day];
            return (
              <tr key={day} className={isToday ? "font-semibold text-stone-900" : "text-stone-700"}>
                <th scope="row" className="py-0.5 pr-3 text-left align-top font-[inherit]">
                  {DAY_LABELS[day].long}
                </th>
                <td className={`py-0.5 text-right align-top ${hours.closed ? "text-stone-400" : ""}`}>
                  {hours.closed ? (
                    describeDay(hours)
                  ) : (
                    // One line per period, so a lunch break reads as two rows
                    // rather than one sentence wrapping mid-time.
                    hours.slots.map((slot, i) => (
                      <div key={i} className="whitespace-nowrap">
                        {describeDay({ closed: false, slots: [slot] })}
                      </div>
                    ))
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="mt-1 text-xs text-stone-500">All times in {SCHEDULE_ZONE_NOTE}.</p>
    </div>
  );
}
