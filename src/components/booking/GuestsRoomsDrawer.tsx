"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { format, parseISO } from "date-fns";
import Money from "@/components/Money";
import TravelerForm from "@/components/booking/TravelerForm";
import { bookDeparture } from "@/lib/bookDeparture";
import { clearSaved, loadSaved, save } from "@/lib/bookingDraft";
import {
  blankDraft,
  draftToDetails,
  resizeTravelers,
  roomOfTraveler,
  validateDraft,
  type TravelerDraft,
} from "@/lib/travelerDetails";
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
  departure: { id: string; startDate: string; endDate: string; price: number };
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
  const [step, setStep] = useState<"rooms" | "travelers" | "review">("rooms");
  // What the traveler has typed. It is restored from this tab's storage when
  // they come back from logging in, and kept in step with the rooms.
  const [draft, setDraft] = useState<TravelerDraft>(
    () => loadSaved(departure.id)?.draft ?? blankDraft(totals(rooms).travelers)
  );
  const [showErrors, setShowErrors] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [sent, setSent] = useState(false);
  const partySize = totals(rooms).travelers;

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

  useEffect(() => {
    setDraft((d) => resizeTravelers(d, partySize));
  }, [partySize]);

  useEffect(() => {
    if (!mounted || sent) return;
    save(departure.id, { rooms, draft });
  }, [mounted, sent, departure.id, rooms, draft]);

  // Who is signed in, asked when the traveler reaches the details: it fills in
  // the lead traveler's name and email, or tells a visitor an account is needed.
  useEffect(() => {
    if (step !== "travelers" || signedIn !== null) return;
    let live = true;
    fetch("/api/auth/me", { cache: "no-store" })
      .then((r) => r.json())
      .then((me: { signedIn?: boolean; name?: string; email?: string }) => {
        if (!live) return;
        setSignedIn(Boolean(me.signedIn));
        if (!me.signedIn) return;
        const [first = "", ...rest] = String(me.name ?? "").trim().split(/\s+/);
        setDraft((d) => ({
          ...d,
          email: d.email || me.email || "",
          travelers: d.travelers.map((t, i) =>
            i === 0 && !t.firstName && !t.lastName ? { ...t, firstName: first, lastName: rest.join(" ") } : t
          ),
        }));
      })
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [step, signedIn]);

  if (!mounted) return null;

  const { travelers, rooms: roomCount } = totals(rooms);
  const errors = validateRooms(rooms, maxTravelers);
  const valid = errors.length === 0;
  const detailErrors = validateDraft(draft, rooms);
  const loginNext = encodeURIComponent(
    `/packages/${slug}?departure=${departure.id}&adults=${travelers}&rooms=${roomCount}&book=1#dates`
  );
  const stepNumber = step === "rooms" ? 1 : step === "travelers" ? 2 : 3;
  const stepTitle = step === "rooms" ? "Select Guests & Rooms" : step === "travelers" ? "Traveler Details" : "Review & Payment";

  function goToReview() {
    setShowErrors(true);
    if (Object.keys(detailErrors).length > 0) {
      requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.scrollIntoView({ block: "center" });
        first?.focus();
      });
      return;
    }
    setStep("review");
  }

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
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none md:w-[30rem] md:max-w-[90vw] lg:w-[32rem] ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-5 pb-1 pt-5">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold-700">
              Booking &middot; Step {stepNumber}
            </p>
            <h2 id={titleId} className="mt-0.5 font-display text-2xl font-bold text-brand-950">
              {stepTitle}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={close}
            aria-label="Close"
            className="-mr-1.5 rounded-full p-1.5 text-stone-700 transition-colors hover:bg-stone-100 hover:text-stone-900"
          >
            <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain px-5 pb-5">
          {step === "rooms" ? (
            <>
              <p className="mt-2 text-sm leading-relaxed text-stone-800">
                If you require more than {MAX_ROOMS} rooms or more than {MAX_BEDS_PER_ROOM} beds per room please{" "}
                <Link href="/contact" className="font-semibold text-gold-700 underline underline-offset-2 hover:text-gold-800">
                  contact us
                </Link>
                .
              </p>

              <ul className="mt-4 space-y-3">
                {rooms.map((room, i) => (
                  <li key={room.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 bg-gold-50 px-4 py-2.5">
                      <h3 className="flex items-center gap-2.5 text-sm font-bold uppercase tracking-wide text-brand-950">
                        <BedIcon className="h-5 w-5 text-brand-900" />
                        Room {i + 1}
                      </h3>
                      {rooms.length > 1 && (
                        <button
                          type="button"
                          onClick={() => onRooms(rooms.filter((r) => r.id !== room.id))}
                          aria-label={`Remove room ${i + 1}`}
                          className="text-xs font-semibold text-stone-600 underline underline-offset-2 hover:text-red-700"
                        >
                          Remove room
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-stone-200 px-4">
                      <Row label="Adults (18+)" hint="Number of adults in this room">
                        <Stepper
                          label={`adults in room ${i + 1}`}
                          value={room.adults}
                          min={1}
                          max={MAX_ADULTS_PER_ROOM}
                          canIncrease={maxTravelers === null || travelers < maxTravelers}
                          onChange={(n) => update(room.id, (r) => withAdults(r, n))}
                        />
                      </Row>
                      <Row label="Beds needed" hint="1 bed = 1 person, 2 beds = twin room">
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
                className="mt-4 flex w-full items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-gold-500 px-4 py-3 text-sm font-bold uppercase tracking-wide text-gold-700 transition-colors hover:bg-gold-50 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
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
                pricePerPerson={departure.price}
              />
            </>
          ) : step === "travelers" ? (
            <TravelerForm
              rooms={rooms}
              draft={draft}
              onDraft={setDraft}
              errors={detailErrors}
              showErrors={showErrors}
              signedIn={signedIn}
              loginNext={loginNext}
            />
          ) : (
            <ReviewStep
              rooms={rooms}
              draft={draft}
              tripTitle={tripTitle}
              tripImage={tripImage}
              itineraryId={itineraryId}
              departure={departure}
              loginNext={loginNext}
              onSent={() => {
                setSent(true);
                clearSaved(departure.id);
              }}
              onBack={() => setStep("travelers")}
            />
          )}
        </div>

        {step !== "review" && (
          <div className="border-t border-stone-200 bg-white px-5 pb-[max(0.875rem,env(safe-area-inset-bottom))] pt-3">
            {step === "rooms" && !valid && (
              <ul role="alert" className="mb-2 space-y-0.5 text-xs text-red-700">
                {errors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            )}
            {step === "travelers" && showErrors && Object.keys(detailErrors).length > 0 && (
              <p role="alert" className="mb-2 text-xs text-red-700">
                Please check the highlighted fields.
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={step === "rooms" ? close : () => setStep("rooms")}
                className="shrink-0 rounded-xl border border-stone-300 bg-white px-5 py-3 text-base font-semibold text-stone-800 transition-colors hover:bg-stone-50"
              >
                {step === "rooms" ? "Cancel" : "Back"}
              </button>
              <button
                type="button"
                disabled={step === "rooms" && !valid}
                onClick={() => {
                  if (step === "rooms") {
                    onContinue(rooms);
                    setShowErrors(false);
                    setStep("travelers");
                  } else goToReview();
                }}
                className="flex flex-1 items-center justify-center gap-2.5 rounded-xl bg-brand-900 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-300"
              >
                Continue
                <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3">
      <div>
        <p className="text-[15px] font-medium text-stone-900">{label}</p>
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
    "flex h-10 w-10 items-center justify-center rounded-lg border border-stone-300 md:h-9 md:w-9 bg-white text-stone-900 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:shadow-none disabled:hover:bg-white";
  return (
    <div className="flex items-center gap-3">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span aria-live="polite" aria-label={`${value} ${label}`} className="w-5 text-center text-lg font-bold text-stone-900">
        {value}
      </span>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max || !canIncrease} onClick={() => onChange(value + 1)} className={btn}>
        <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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
  pricePerPerson,
}: {
  title: string;
  image: string | null;
  startDate: string;
  endDate: string;
  travelers: number;
  rooms: number;
  pricePerPerson: number;
}) {
  const rows: { icon: React.ReactNode; text: string }[] = [
    { icon: <CalendarIcon />, text: dateRangeLabel(startDate, endDate) },
    { icon: <MoonIcon />, text: durationLabel(startDate, endDate) },
    { icon: <PersonIcon />, text: `${travelers} Traveler${travelers === 1 ? "" : "s"}` },
    { icon: <BedIcon className="h-5 w-5" />, text: `${rooms} Room${rooms === 1 ? "" : "s"}` },
  ];
  return (
    <section aria-label="Trip summary" className="mt-6 rounded-xl bg-stone-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-xl font-bold text-brand-950">Trip Summary</h3>
        <span className="rounded-full bg-gold-100 px-2.5 py-0.5 text-[11px] font-bold text-gold-800">Selected departure</span>
      </div>
      <div className="mt-3 flex gap-3">
        <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-600 to-brand-950">
          {image && <Image src={image} alt="" fill unoptimized sizes="80px" className="object-cover" />}
        </div>
        <div className="min-w-0">
          <p className="font-display text-base font-bold leading-snug text-brand-950">{title}</p>
          <ul className="mt-2 space-y-1.5 text-sm text-stone-800">
            {rows.map((r) => (
              <li key={r.text} className="flex items-center gap-2.5">
                <span className="text-stone-600">{r.icon}</span>
                {r.text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <dl className="mt-4 space-y-1.5 border-t border-stone-200 pt-3 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-stone-700">Price per person</dt>
          <dd className="font-semibold text-stone-900">
            <Money btn={pricePerPerson} />
          </dd>
        </div>
        <div className="flex items-center justify-between text-base">
          <dt className="font-bold text-stone-900">Estimated total</dt>
          <dd className="font-bold text-brand-950">
            <Money btn={pricePerPerson * travelers} />
          </dd>
        </div>
      </dl>
      <p className="mt-2 text-[11px] leading-snug text-stone-600">
        Final price may vary based on room configuration and applicable supplements. Nothing is charged at this step.
      </p>
    </section>
  );
}

/**
 * Step 3, for now a review: who is going, how to reach them, and a note that
 * payment and confirmation are being added. Until they are, it offers the
 * booking request that already works — it carries the traveler details — so a
 * customer who gets this far is never left at a dead end.
 */
function ReviewStep({
  rooms,
  draft,
  tripTitle,
  tripImage,
  itineraryId,
  departure,
  loginNext,
  onSent,
  onBack,
}: {
  rooms: Room[];
  draft: TravelerDraft;
  tripTitle: string;
  tripImage: string | null;
  itineraryId: string;
  departure: { id: string; startDate: string; endDate: string; price: number };
  loginNext: string;
  onSent: () => void;
  onBack: () => void;
}) {
  const { travelers, rooms: roomCount } = totals(rooms);
  const roomFor = roomOfTraveler(rooms);
  const [state, setState] = useState<"idle" | "sending" | "done" | "login" | "error">("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ id: string; reference: string } | null>(null);

  async function send() {
    setState("sending");
    setMessage(null);
    const result = await bookDeparture({
      itineraryId,
      departureId: departure.id,
      startDate: departure.startDate,
      travelers,
      rooms: roomCount,
      details: draftToDetails(draft, rooms),
    });
    if (result.kind === "ok") {
      setBooked({ id: result.id, reference: result.reference });
      setState("done");
      onSent();
    } else if (result.kind === "login") setState("login");
    else {
      setMessage(result.message);
      setState("error");
    }
  }

  return (
    <div className="mt-3 space-y-4">
      <section aria-label="Travelers" className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-bold text-brand-950">Who is travelling</h3>
        <ul className="mt-2 divide-y divide-stone-100 text-sm">
          {draft.travelers.map((t, i) => (
            <li key={i} className="flex items-start justify-between gap-3 py-2">
              <span>
                <span className="font-semibold text-stone-900">
                  {t.firstName} {t.lastName}
                </span>
                <span className="block text-xs text-stone-600">
                  {t.nationality}
                  {t.dietary ? ` · ${t.dietary}` : ""}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-stone-500">Room {roomFor[i]}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-2 space-y-1 border-t border-stone-100 pt-3 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-stone-600">Email</dt>
            <dd className="break-all text-right font-medium text-stone-900">{draft.email}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-stone-600">Phone</dt>
            <dd className="font-medium text-stone-900">{draft.phone}</dd>
          </div>
          {draft.requests && (
            <div className="flex justify-between gap-3">
              <dt className="text-stone-600">Note</dt>
              <dd className="text-right text-stone-900">{draft.requests}</dd>
            </div>
          )}
        </dl>
      </section>

      <TripSummary
        title={tripTitle}
        image={tripImage}
        startDate={departure.startDate}
        endDate={departure.endDate}
        travelers={travelers}
        rooms={roomCount}
        pricePerPerson={departure.price}
      />

      <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50 p-4 text-sm text-stone-800">
        <p className="font-semibold text-stone-900">Payment and confirmation come next</p>
        <p className="mt-1">These steps are being added. Your details are saved, so you can go back and change anything.</p>
      </div>

      <div className="rounded-xl border border-brand-200 bg-brand-50 p-4">
        <p className="text-sm font-semibold text-stone-900">Want to go ahead now?</p>
        <p className="mt-1 text-sm text-stone-700">
          Send this as a booking request, with these details. We confirm availability and the final price by email, then
          arrange payment. Nothing is charged.
        </p>

        {state === "done" && booked ? (
          <p className="mt-3 rounded-lg bg-emerald-50 px-3 py-2.5 text-sm text-emerald-900">
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
            className="mt-3 rounded-full bg-brand-900 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Send booking request"}
          </button>
        )}

        <div aria-live="polite" className="empty:hidden">
          {state === "login" && (
            <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
              Please{" "}
              <Link href={`/login?next=${loginNext}`} className="font-semibold underline">
                log in
              </Link>{" "}
              or{" "}
              <Link href={`/register?next=${loginNext}`} className="font-semibold underline">
                create a free account
              </Link>{" "}
              to book. Your rooms and details are kept, and you&apos;ll come straight back.
            </p>
          )}
          {state === "error" && message && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{message}</p>}
        </div>
      </div>

      {state !== "done" && (
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-brand-800 underline underline-offset-2 hover:text-brand-950"
        >
          ← Edit traveler details
        </button>
      )}
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
