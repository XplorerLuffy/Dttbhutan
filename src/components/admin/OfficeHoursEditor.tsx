"use client";

import {
  DAY_KEYS,
  DAY_LABELS,
  DEFAULT_SCHEDULE,
  MAX_SLOTS_PER_DAY,
  SCHEDULE_ZONE_NOTE,
  parseSchedule,
  scheduleError,
  serializeSchedule,
  type DayKey,
  type Schedule,
  type Slot,
} from "@/lib/officeHours";

/**
 * Weekly opening hours, edited the way Google Business Profile does it: a
 * row per day with a Closed box, "Opens at" and "Closes at" times, and a +
 * for a second open period (a lunch break is two periods).
 *
 * The value is the JSON text of a Schedule. Every edit reports the whole new
 * text, so the content editor's "edited / Save" logic works on it like any
 * other field. A blank or unreadable value shows the default week.
 */
export default function OfficeHoursEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const parsed = parseSchedule(value);
  const schedule: Schedule = parsed ?? DEFAULT_SCHEDULE;
  const legacyText = !parsed && value.trim() && !value.trim().startsWith("{") ? value.trim() : "";
  const problem = scheduleError(schedule);

  function update(next: Schedule) {
    onChange(serializeSchedule(next));
  }

  function setDay(day: DayKey, patch: Partial<Schedule[DayKey]>) {
    update({ ...schedule, [day]: { ...schedule[day], ...patch } });
  }

  function setSlot(day: DayKey, index: number, patch: Partial<Slot>) {
    const slots = schedule[day].slots.map((s, i) => (i === index ? { ...s, ...patch } : s));
    setDay(day, { slots });
  }

  function addSlot(day: DayKey) {
    const slots = schedule[day].slots;
    if (slots.length >= MAX_SLOTS_PER_DAY) return;
    // Start the new period an hour after the last one ends, if there is room.
    const last = slots[slots.length - 1];
    const [h] = last.close.split(":").map(Number);
    const open = h < 22 ? `${String(h + 1).padStart(2, "0")}:00` : last.close;
    const close = h < 22 ? `${String(Math.min(h + 3, 23)).padStart(2, "0")}:00` : "23:30";
    setDay(day, { closed: false, slots: [...slots, { open, close }] });
  }

  function removeSlot(day: DayKey, index: number) {
    setDay(day, { slots: schedule[day].slots.filter((_, i) => i !== index) });
  }

  function copyMondayToWeekdays() {
    const monday = schedule.mon;
    const next = { ...schedule };
    for (const d of ["tue", "wed", "thu", "fri"] as const) {
      next[d] = { closed: monday.closed, slots: monday.slots.map((s) => ({ ...s })) };
    }
    update(next);
  }

  return (
    <div className="rounded-lg border border-stone-200 p-3 sm:p-4">
      {legacyText && (
        <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          The hours were saved as plain text: &ldquo;{legacyText}&rdquo;. Set the week below and
          save to replace it.
        </p>
      )}

      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm text-stone-600">
          Times are in {SCHEDULE_ZONE_NOTE}. Tick <strong>Closed</strong> for days off; use{" "}
          <strong>+</strong> to add a second period, such as after a lunch break.
        </p>
        <div className="flex gap-3 text-sm">
          <button
            type="button"
            onClick={copyMondayToWeekdays}
            className="font-medium text-brand-700 hover:underline"
          >
            Copy Monday to Tue–Fri
          </button>
          <button
            type="button"
            onClick={() => onChange(serializeSchedule(DEFAULT_SCHEDULE))}
            className="font-medium text-stone-600 hover:underline"
          >
            Reset
          </button>
        </div>
      </div>

      <ul className="divide-y divide-stone-100">
        {DAY_KEYS.map((day) => {
          const hours = schedule[day];
          return (
            <li key={day} className="grid gap-3 py-4 sm:grid-cols-[9.5rem_1fr] sm:gap-4">
              <div>
                <p className="text-base font-medium text-stone-900">{DAY_LABELS[day].long}</p>
                <label className="mt-2 inline-flex cursor-pointer items-center gap-2 text-sm text-stone-700">
                  <input
                    type="checkbox"
                    checked={hours.closed}
                    onChange={(e) => setDay(day, { closed: e.target.checked })}
                    className="h-5 w-5 rounded border-stone-400 accent-brand-700"
                  />
                  Closed
                </label>
              </div>

              <div className="space-y-3">
                {hours.slots.map((slot, i) => (
                  <div key={i} className="flex items-center gap-2 sm:gap-3">
                    <TimeBox
                      label="Opens at"
                      value={slot.open}
                      disabled={hours.closed}
                      onChange={(v) => setSlot(day, i, { open: v })}
                    />
                    <TimeBox
                      label="Closes at"
                      value={slot.close}
                      disabled={hours.closed}
                      onChange={(v) => setSlot(day, i, { close: v })}
                    />
                    {i === 0 ? (
                      <IconButton
                        label={`Add another period for ${DAY_LABELS[day].long}`}
                        onClick={() => addSlot(day)}
                        disabled={hours.closed || hours.slots.length >= MAX_SLOTS_PER_DAY}
                      >
                        +
                      </IconButton>
                    ) : (
                      <IconButton
                        label={`Remove this period on ${DAY_LABELS[day].long}`}
                        onClick={() => removeSlot(day, i)}
                      >
                        ×
                      </IconButton>
                    )}
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      {problem && (
        <p role="alert" className="mt-1 text-sm text-red-700">
          {problem}
        </p>
      )}
    </div>
  );
}

function TimeBox({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label className="relative block min-w-0 flex-1">
      <span className="absolute -top-2 left-3 z-10 bg-white px-1 text-xs text-stone-500">
        {label}
      </span>
      <input
        type="time"
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        // Not the shared .input class: this is the outlined, floating-label
        // box from Google's editor, taller than the site's other fields.
        className="h-14 w-full rounded-lg border border-stone-400 bg-white px-3 text-base text-stone-900 focus:border-brand-700 focus:outline-none focus:ring-1 focus:ring-brand-700 disabled:border-stone-200 disabled:bg-stone-50 disabled:text-stone-400 sm:px-4"
      />
    </label>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-2xl leading-none text-stone-600 hover:bg-stone-100 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
