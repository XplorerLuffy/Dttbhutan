"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import { bookDeparture } from "@/lib/bookDeparture";
import {
  MAX_ADULTS_PER_ROOM,
  MAX_BEDS_PER_ROOM,
  MAX_ROOMS,
  canAddRoom,
  newRoom,
  totals,
  validateRooms,
  withAdults,
  withBeds,
  type Room,
} from "@/lib/guestRooms";

/**
 * Step 1 of booking a scheduled departure: how many people, in how many rooms.
 * A panel that slides in over the trip page from the right (full screen on a
 * phone), opened by "Book This Trip" on a departure.
 *
 * The room list is owned by the page's DepartureList, so closing the panel and
 * opening it again — or stepping forward and back — keeps what was chosen.
 * Continue moves to a placeholder for the next step. Until that step exists,
 * it also offers the existing "send as a booking request" so a customer who
 * gets this far is never left at a dead end.
 */

type Props = {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  onRooms: (rooms: Room[]) => void;
  /** Called when Continue is pressed with a valid configuration. */
  onContinue: (rooms: Room[]) => void;
  tripTitle: string;
  tripImage: string | null;
  slug: string;
  itineraryId: string;
  departure: { id: string; startDate: string; endDate: string };
  maxTravelers: number | null;
};

export default function GuestsRoomsDrawer({
  open,
  onClose,
  rooms,
  onRooms,
  onContinue,
  tripTitle,
  tripImage,
  slug,
  itineraryId,
  departure,
  maxTravelers,
}: Props) {
  // `mounted` keeps the panel in the page long enough to slide out; `shown`
  // drives the slide itself.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [step, setStep] = useState<"rooms" | "next">("rooms");

  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (open) {
      returnFocusTo.current = document.activeElement as HTMLElement | null;
      setMounted(true);
      const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
      return () => cancelAnimationFrame(frame);
    }
    setShown(false);
    const t = window.setTimeout(() => {
      setMounted(false);
      returnFocusTo.current?.focus();
    }, 300);
    return () => window.clearTimeout(t);
  }, [open]);

  const close = useCallback(() => onClose(), [onClose]);

  // While open: the page behind does not scroll, Escape closes, Tab stays inside.
  useEffect(() => {
    if (!mounted || !open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__lenis?.stop();
    closeRef.current?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
        return;
      }
      if (e.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [mounted, open, close]);

  if (!mounted) return null;

  const { travelers, rooms: roomCount } = totals(rooms);
  const errors = validateRooms(rooms, maxTravelers);
  const valid = errors.length === 0;

  const update = (id: string, change: (r: Room) => Room) =>
    onRooms(rooms.map((r) => (r.id === id ? change(r) : r)));

  const addRoom = () => {
    const room = newRoom(1);
    onRooms([...rooms, room]);
  };

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close guests and rooms"
        tabIndex={-1}
        onClick={close}
        className={`absolute inset-0 h-full w-full cursor-default bg-ink-950/60 backdrop-blur-[1px] transition-opacity duration-300 motion-reduce:transition-none ${
          shown ? "opacity-100" : "opacity-0"
        }`}
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none md:w-[46vw] md:min-w-[26rem] md:max-w-[40rem] ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-2 pt-6 sm:px-8">
          <h2 id={titleId} className="font-display text-3xl font-bold text-brand-950 sm:text-[2rem]">
            {step === "rooms" ? "Select Guests & Rooms" : "Traveler Details"}
          </h2>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-2 rounded-full p-2 text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-6 sm:px-8">
          {step === "rooms" ? (
            <>
              <p className="mt-3 text-[15px] leading-relaxed text-stone-800">
                If you require more than {MAX_ROOMS} rooms or more than {MAX_BEDS_PER_ROOM} beds per room please{" "}
                <Link href="/contact" className="font-semibold text-gold-700 underline underline-offset-2 hover:text-gold-800">
                  contact us
                </Link>
                .
              </p>

              <ul className="mt-5 space-y-4">
                {rooms.map((room, i) => (
                  <li key={room.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 bg-gold-50 px-5 py-3.5">
                      <h3 className="flex items-center gap-3 text-base font-bold uppercase tracking-wide text-brand-950">
                        <BedIcon className="h-7 w-7 text-brand-900" />
                        Room {i + 1}
                      </h3>
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRooms(rooms.filter((r) => r.id !== room.id))}
                          aria-label={`Remove room ${i + 1}`}
                          className="text-sm font-semibold text-stone-600 underline underline-offset-2 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-stone-200 px-5">
                      <Row label="Adults (18+)">
                        <Stepper
                          label={`adults in room ${i + 1}`}
                          value={room.adults}
                          min={1}
                          max={MAX_ADULTS_PER_ROOM}
                          canIncrease={maxTravelers === null || travelers < maxTravelers}
                          onChange={(n) => update(room.id, (r) => withAdults(r, n))}
                        />
                      </Row>
                      <Row label="Beds needed" hint="(1 bed = 1 person, 2 beds = twin room)">
                        <Stepper
                          label={`beds in room ${i + 1}`}
                          value={room.beds}
                          min={1}
                          max={Math.min(MAX_BEDS_PER_ROOM, room.adults)}
                          onChange={(n) => update(room.id, (r) => withBeds(r, n))}
                        />
                      </Row>
                    </div>
                  </li>
                ))}
              </ul>

              <button
                type="button"
                onClick={addRoom}
                disabled={!canAddRoom(rooms, maxTravelers)}
                className="mt-5 flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gold-500 px-4 py-4 text-base font-bold uppercase tracking-wide text-gold-700 transition-colors hover:bg-gold-50 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Add another room
              </button>

              <TripSummary
                title={tripTitle}
                image={tripImage}
                startDate={departure.startDate}
                endDate={departure.endDate}
                travelers={travelers}
                rooms={roomCount}
              />
            </>
          ) : (
            <NextStep
              rooms={rooms}
              tripTitle={tripTitle}
              tripImage={tripImage}
              slug={slug}
              itineraryId={itineraryId}
              departure={departure}
              onBack={() => setStep("rooms")}
            />
          )}
        </div>

        {step === "rooms" && (
          <div className="border-t border-stone-200 bg-white px-5 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 sm:px-8">
            {!valid && (
              <ul role="alert" className="mb-3 space-y-0.5 text-sm text-red-700">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            <button
              type="button"
              disabled={!valid}
              onClick={() => {
                onContinue(rooms);
                setStep("next");
              }}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-brand-900 px-6 py-4 text-xl font-bold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-300"
            >
              Continue
              <svg aria-hidden viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 py-4">
      <div>
        <p className="text-base font-medium text-stone-900">{label}</p>
        {hint && <p className="mt-0.5 text-xs text-stone-600">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

function Stepper({
  label,
  value,
  min,
  max,
  canIncrease = true,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  canIncrease?: boolean;
  onChange: (n: number) => void;
}) {
  const btn =
    "flex h-11 w-11 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-900 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:shadow-none disabled:hover:bg-white";
  return (
    <div className="flex items-center gap-4">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span aria-live="polite" aria-label={`${value} ${label}`} className="w-6 text-center text-xl font-bold text-stone-900">
        {value}
      </span>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max || !canIncrease} onClick={() => onChange(value + 1)} className={btn}>
        <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
    </div>
  );
}

/** "Mar 14 – Mar 22, 2027", with both years when the trip crosses New Year. */
export function dateRangeLabel(startIso: string, endIso: string): string {
  const s = parseISO(startIso);
  const e = parseISO(endIso);
  return s.getFullYear() === e.getFullYear()
    ? `${format(s, "MMM d")} – ${format(e, "MMM d, yyyy")}`
    : `${format(s, "MMM d, yyyy")} – ${format(e, "MMM d, yyyy")}`;
}

export function durationLabel(startIso: string, endIso: string): string {
  const nights = Math.round((parseISO(endIso).getTime() - parseISO(startIso).getTime()) / 86_400_000);
  return `${nights + 1} Days / ${nights} Nights`;
}

function TripSummary({
  title,
  image,
  startDate,
  endDate,
  travelers,
  rooms,
}: {
  title: string;
  image: string | null;
  startDate: string;
  endDate: string;
  travelers: number;
  rooms: number;
}) {
  const rows: { icon: React.ReactNode; text: string }[] = [
    { icon: <CalendarIcon />, text: dateRangeLabel(startDate, endDate) },
    { icon: <MoonIcon />, text: durationLabel(startDate, endDate) },
    { icon: <PersonIcon />, text: `${travelers} Traveler${travelers === 1 ? "" : "s"}` },
    { icon: <BedIcon className="h-5 w-5" />, text: `${rooms} Room${rooms === 1 ? "" : "s"}` },
  ];
  return (
    <section aria-label="Trip summary" className="mt-8 rounded-xl bg-stone-50 p-5">
      <h3 className="font-display text-2xl font-bold text-brand-950">Trip Summary</h3>
      <div className="mt-4 flex gap-4">
        <div className="relative h-36 w-28 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-600 to-brand-950">
          {image && <Image src={image} alt="" fill unoptimized sizes="112px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold leading-snug text-brand-950">{title}</p>
          <ul className="mt-3 space-y-2 text-[15px] text-stone-800">
            {rows.map((r) => (
              <li key={r.text} className="flex items-center gap-3">
                <span className="text-stone-600">{r.icon}</span>
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

/**
 * Placeholder for Traveler Details, Payment and Confirmation, which are built
 * next. Meanwhile it keeps the chosen party and offers the booking request
 * that already works, so nobody is stranded.
 */
function NextStep({
  rooms,
  tripTitle,
  tripImage,
  slug,
  itineraryId,
  departure,
  onBack,
}: {
  rooms: Room[];
  tripTitle: string;
  tripImage: string | null;
  slug: string;
  itineraryId: string;
  departure: { id: string; startDate: string; endDate: string };
  onBack: () => void;
}) {
  const { travelers, rooms: roomCount } = totals(rooms);
  const [state, setState] = useState<"idle" | "sending" | "done" | "login" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ id: string; reference: string } | null>(null);
  const next = encodeURIComponent(`/packages/${slug}?departure=${departure.id}&adults=${travelers}&rooms=${roomCount}#dates`);

  async function send() {
    setState("sending");
    setMessage(null);
    const result = await bookDeparture({
      itineraryId,
      departureId: departure.id,
      startDate: departure.startDate,
      travelers,
      rooms: roomCount,
    });
    if (result.kind === "ok") {
      setBooked({ id: result.id, reference: result.reference });
      setState("done");
    } else if (result.kind === "login") setState("login");
    else {
      setMessage(result.message);
      setState("error");
    }
  }

  return (
    <div className="mt-4">
      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-5 text-[15px] text-stone-800">
        <p className="font-semibold text-stone-900">Next step: traveler details</p>
        <p className="mt-1">
          Traveler details, payment and confirmation are being added. Your choices are saved, so you can go back and
          change them.
        </p>
      </div>

      <TripSummary
        title={tripTitle}
        image={tripImage}
        startDate={departure.startDate}
        endDate={departure.endDate}
        travelers={travelers}
        rooms={roomCount}
      />

      <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-5">
        <p className="font-semibold text-stone-900">Want to go ahead now?</p>
        <p className="mt-1 text-sm text-stone-700">
          Send this as a booking request. We confirm availability and the final price by email, then arrange payment.
          Nothing is charged.
        </p>

        {state === "done" && booked ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            <strong>Booking requested &middot; reference {booked.reference}.</strong>{" "}
            <Link href={`/dashboard/bookings/${booked.id}`} className="font-semibold underline">
              View it in My trips →
            </Link>
          </p>
        ) : (
          <button
            type="button"
            onClick={send}
            disabled={state === "sending"}
            className="mt-3 rounded-full bg-brand-900 px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send booking request"}
          </button>
        )}

        <div aria-live="polite" className="empty:hidden">
          {state === "login" && (
            <p className="mt-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Please{" "}
              <Link href={`/login?next=${next}`} className="font-semibold underline">
                log in
              </Link>{" "}
              or{" "}
              <Link href={`/register?next=${next}`} className="font-semibold underline">
                create a free account
              </Link>{" "}
              to book. You&apos;ll come straight back to this date.
            </p>
          )}
          {state === "error" && message && <p className="mt-3 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{message}</p>}
        </div>
      </div>

      <button
        type="button"
        onClick={onBack}
        className="mt-6 text-sm font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-950"
      >
        ← Back to guests &amp; rooms
      </button>
    </div>
  );
}

const ICON = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round", strokeLinejoin: "round" } as const;

function BedIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className={className} {...ICON}>
      <path d="M3 18V7M3 14h18v4M21 14v-2.5A2.5 2.5 0 0 0 18.5 9H11v5" />
      <circle cx="7" cy="11" r="1.6" />
    </svg>
  );
}
function CalendarIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" {...ICON}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" {...ICON}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" {...ICON}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.5.7 2.5 2.1 2.9 4.2" />
    </svg>
  );
}
