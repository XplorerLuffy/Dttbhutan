/**
 * Opening hours as data, the way Google Business Profile models them: each
 * day is either closed or has one or more open periods (so a lunch break is
 * two periods, 09:00–13:00 and 14:00–17:00).
 *
 * Stored as JSON text in the single `company.officeHours` content field —
 * the content table holds strings — and read back through parseSchedule.
 * Plain-text values saved before this existed don't parse; callers then show
 * the text as it was (see companyFrom).
 *
 * Pure functions, no server-only imports: the admin editor (browser), public
 * pages, the itinerary PDF and the search-engine markup all use this file.
 */

export const DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
export type DayKey = (typeof DAY_KEYS)[number];

export const DAY_LABELS: Record<DayKey, { long: string; short: string }> = {
  mon: { long: "Monday", short: "Mon" },
  tue: { long: "Tuesday", short: "Tue" },
  wed: { long: "Wednesday", short: "Wed" },
  thu: { long: "Thursday", short: "Thu" },
  fri: { long: "Friday", short: "Fri" },
  sat: { long: "Saturday", short: "Sat" },
  sun: { long: "Sunday", short: "Sun" },
};

/** "HH:MM", 24-hour — the value of an <input type="time">. */
export type Slot = { open: string; close: string };
export type DayHours = { closed: boolean; slots: Slot[] };
export type Schedule = Record<DayKey, DayHours>;

export const MAX_SLOTS_PER_DAY = 3;
/** Bhutan has one time zone and no daylight saving. */
export const SCHEDULE_TIME_ZONE = "Asia/Thimphu";
export const SCHEDULE_ZONE_NOTE = "Bhutan time (UTC+6)";

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export const DEFAULT_SLOT: Slot = { open: "09:00", close: "17:00" };

export const DEFAULT_SCHEDULE: Schedule = Object.fromEntries(
  DAY_KEYS.map((d) => [
    d,
    d === "sat" || d === "sun"
      ? { closed: true, slots: [{ ...DEFAULT_SLOT }] }
      : { closed: false, slots: [{ ...DEFAULT_SLOT }] },
  ])
) as Schedule;

/** Canonical text form. Always the same key order, so an unchanged schedule
 * serialises to the same string and the editor doesn't call it "edited". */
export function serializeSchedule(schedule: Schedule): string {
  const ordered: Record<string, DayHours> = {};
  for (const d of DAY_KEYS) {
    const day = schedule[d];
    ordered[d] = {
      closed: Boolean(day.closed),
      slots: day.slots.map((s) => ({ open: s.open, close: s.close })),
    };
  }
  return JSON.stringify(ordered);
}

/** The schedule in `value`, or null if it isn't one (blank, legacy text, junk). */
export function parseSchedule(value: string | undefined | null): Schedule | null {
  if (!value || !value.trim().startsWith("{")) return null;
  let raw: unknown;
  try {
    raw = JSON.parse(value);
  } catch {
    return null;
  }
  if (!raw || typeof raw !== "object") return null;

  const out = {} as Schedule;
  for (const d of DAY_KEYS) {
    const day = (raw as Record<string, unknown>)[d] as
      | { closed?: unknown; slots?: unknown }
      | undefined;
    const slots = Array.isArray(day?.slots)
      ? (day!.slots as unknown[])
          .map((s) => s as Partial<Slot>)
          .filter((s) => typeof s?.open === "string" && typeof s?.close === "string")
          .map((s) => ({ open: s.open as string, close: s.close as string }))
          .slice(0, MAX_SLOTS_PER_DAY)
      : [];
    // A day missing from the data is closed rather than open all day.
    out[d] = {
      closed: day ? Boolean(day.closed) || slots.length === 0 : true,
      slots: slots.length ? slots : [{ ...DEFAULT_SLOT }],
    };
  }
  return out;
}

/** Why this schedule can't be saved, in words for the admin; null if fine. */
export function scheduleError(schedule: Schedule): string | null {
  for (const d of DAY_KEYS) {
    const day = schedule[d];
    if (day.closed) continue;
    let previousClose = "";
    for (const slot of day.slots) {
      const name = DAY_LABELS[d].long;
      if (!TIME.test(slot.open) || !TIME.test(slot.close)) {
        return `${name}: enter both an opening and a closing time.`;
      }
      if (slot.close <= slot.open) {
        return `${name}: closing time must be after opening time.`;
      }
      if (previousClose && slot.open < previousClose) {
        return `${name}: the second period must start after the first one ends.`;
      }
      previousClose = slot.close;
    }
  }
  return null;
}

/** "17:00" → "5:00 pm". */
export function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return time;
  const suffix = h >= 12 ? "pm" : "am";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
}

/** What one day's hours read as: "9:00 am – 5:00 pm", or "Closed". */
export function describeDay(day: DayHours): string {
  if (day.closed) return "Closed";
  return day.slots.map((s) => `${formatTime(s.open)} – ${formatTime(s.close)}`).join(", ");
}

/**
 * One line: "Mon – Fri: 9:00 am – 5:00 pm · Sat – Sun: Closed (Bhutan time, UTC+6)".
 * Runs of consecutive days with identical hours are grouped. Used where a
 * table won't fit — the itinerary PDF, the assistant's knowledge.
 */
export function summariseSchedule(schedule: Schedule): string {
  const groups: { from: DayKey; to: DayKey; text: string }[] = [];
  for (const d of DAY_KEYS) {
    const text = describeDay(schedule[d]);
    const last = groups[groups.length - 1];
    if (last && last.text === text) last.to = d;
    else groups.push({ from: d, to: d, text });
  }
  const parts = groups.map((g) => {
    const label =
      groups.length === 1
        ? "Every day"
        : g.from === g.to
          ? DAY_LABELS[g.from].short
          : `${DAY_LABELS[g.from].short} – ${DAY_LABELS[g.to].short}`;
    return `${label}: ${g.text}`;
  });
  return `${parts.join(" · ")} (Bhutan time, UTC+6)`;
}

/**
 * Whether the office is open at `now`, read in Bhutan time whatever the
 * viewer's own zone is. `note` says when that next changes: "Open now · closes
 * at 5:00 pm", "Closed now · opens Monday at 9:00 am".
 */
export function openStatus(
  schedule: Schedule,
  now: Date = new Date()
): { open: boolean; note: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SCHEDULE_TIME_ZONE,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const todayIndex = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"].indexOf(
    get("weekday").toLowerCase().slice(0, 3)
  );
  const time = `${get("hour")}:${get("minute")}`;
  if (todayIndex < 0) return { open: false, note: "" };

  const today = schedule[DAY_KEYS[todayIndex]];
  if (!today.closed) {
    const current = today.slots.find((s) => time >= s.open && time < s.close);
    if (current) return { open: true, note: `Open now · closes at ${formatTime(current.close)}` };
    const later = today.slots.find((s) => s.open > time);
    if (later) return { open: false, note: `Closed now · opens today at ${formatTime(later.open)}` };
  }
  for (let i = 1; i <= 7; i++) {
    const key = DAY_KEYS[(todayIndex + i) % 7];
    const day = schedule[key];
    if (!day.closed) {
      const when = i === 1 ? "tomorrow" : DAY_LABELS[key].long;
      return { open: false, note: `Closed now · opens ${when} at ${formatTime(day.slots[0].open)}` };
    }
  }
  return { open: false, note: "Closed now" };
}

/** schema.org OpeningHoursSpecification entries, grouping days that share hours. */
export function openingHoursJsonLd(schedule: Schedule) {
  const byHours = new Map<string, { days: string[]; opens: string; closes: string }>();
  for (const d of DAY_KEYS) {
    const day = schedule[d];
    if (day.closed) continue;
    for (const slot of day.slots) {
      const key = `${slot.open}-${slot.close}`;
      const entry = byHours.get(key) ?? { days: [], opens: slot.open, closes: slot.close };
      entry.days.push(DAY_LABELS[d].long);
      byHours.set(key, entry);
    }
  }
  return Array.from(byHours.values()).map((e) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: e.days,
    opens: e.opens,
    closes: e.closes,
  }));
}
