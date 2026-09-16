"use client";

import { useRef, useState } from "react";
import { useClickOutside } from "./useClickOutside";

/**
 * Booking.com-style occupancy field: a button showing a one-line summary
 * that opens a dropdown with +/- steppers for adults, children, and
 * rooms. Submits as plain hidden inputs on the enclosing GET form.
 */
export default function OccupancyField({
  adultsName = "adults",
  childrenName = "children",
  roomsName = "rooms",
}: {
  adultsName?: string;
  childrenName?: string;
  roomsName?: string;
}) {
  const [open, setOpen] = useState(false);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const wrapRef = useRef<HTMLDivElement>(null);

  useClickOutside(wrapRef, () => setOpen(false));

  return (
    <div ref={wrapRef} className="relative flex-1">
      <input type="hidden" name={adultsName} value={adults} />
      <input type="hidden" name={childrenName} value={children} />
      <input type="hidden" name={roomsName} value={rooms} />
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 rounded-md border-2 border-gold-400 bg-white px-4 py-3 text-left"
      >
        <IconUser className="h-5 w-5 shrink-0 text-stone-400" />
        <span className="min-w-0 flex-1">
          <span className="block text-xs text-stone-500">Select occupancy</span>
          <span className="block truncate text-sm font-medium text-stone-900">
            {adults} adult{adults === 1 ? "" : "s"} · {children} child{children === 1 ? "" : "ren"} ·{" "}
            {rooms} room{rooms === 1 ? "" : "s"}
          </span>
        </span>
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-2 w-full min-w-[280px] rounded-lg border border-stone-200 bg-white p-4 shadow-xl sm:w-80">
          <Stepper label="Adults" value={adults} min={1} onChange={setAdults} />
          <Stepper label="Children" value={children} min={0} onChange={setChildren} />
          <Stepper label="Rooms" value={rooms} min={1} onChange={setRooms} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="btn-secondary mt-2 w-full"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-stone-100 py-2.5 last:border-0">
      <span className="text-sm font-medium text-stone-700">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-stone-600 disabled:opacity-30"
        >
          −
        </button>
        <span className="w-4 text-center text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-300 text-stone-600"
        >
          +
        </button>
      </div>
    </div>
  );
}

function IconUser({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M4.5 20c1-4 4-6 7.5-6s6.5 2 7.5 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
