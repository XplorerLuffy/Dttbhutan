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
import { PAYMENT_LABEL, PAYMENT_METHODS, isPaymentMethod, type PaymentCopy } from "@/lib/payment";
import {
  blankDraft,
  draftToDetails,
  resizeTravelers,
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
 * Booking a scheduled departure, in three steps inside one panel that slides in
 * from the right (full screen on a phone), opened by "Book This Trip":
 *
 *   1. Guests & rooms   2. Traveler details   3. Payment
 *
 * The room list is owned by the page's DepartureList, so closing the panel and
 * opening it again keeps what was chosen; what has been typed is also kept in
 * this tab so a trip to the login page and back loses nothing.
 *
 * Payment: nothing is charged on the site. The traveler picks how they will pay
 * (bank transfer, mobile wallet or cash) and confirms; that creates a pending
 * booking, the agency confirms availability and the price by email, and the
 * traveler then pays the way they chose.
 */

type Departure = { id: string; startDate: string; endDate: string; price: number };

type Props = {
  open: boolean;
  onClose: () => void;
  rooms: Room[];
  onRooms: (rooms: Room[]) => void;
  /** Called when Continue is pressed on step 1 with a valid configuration. */
  onContinue: (rooms: Room[]) => void;
  tripTitle: string;
  tripImage: string | null;
  slug: string;
  itineraryId: string;
  departure: Departure;
  maxTravelers: number | null;
  paymentCopy: PaymentCopy;
};

type Step = "rooms" | "travelers" | "payment";
type Submit =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "login" }
  | { kind: "error"; message: string }
  | { kind: "done"; id: string; reference: string };

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
  paymentCopy,
}: Props) {
  // `mounted` keeps the panel in the page long enough to slide out; `shown`
  // drives the slide itself.
  const [mounted, setMounted] = useState(open);
  const [shown, setShown] = useState(false);
  const [step, setStep] = useState<Step>("rooms");
  const [draft, setDraft] = useState<TravelerDraft>(
    () => loadSaved(departure.id)?.draft ?? blankDraft(totals(rooms).travelers)
  );
  const [showErrors, setShowErrors] = useState(false);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [submit, setSubmit] = useState<Submit>({ kind: "idle" });
  const partySize = totals(rooms).travelers;
  const done = submit.kind === "done";

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
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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

  // Keep one row per adult as the party changes (typed rows are kept).
  useEffect(() => {
    setDraft((d) => resizeTravelers(d, partySize));
  }, [partySize]);

  useEffect(() => {
    if (!mounted || done) return;
    save(departure.id, { rooms, draft });
  }, [mounted, done, departure.id, rooms, draft]);

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
  const method = isPaymentMethod(draft.paymentMethod) ? draft.paymentMethod : null;
  const loginNext = encodeURIComponent(
    `/packages/${slug}?departure=${departure.id}&adults=${travelers}&rooms=${roomCount}&book=1#dates`
  );
  const stepNumber = step === "rooms" ? 1 : step === "travelers" ? 2 : 3;
  const stepTitle = done
    ? "Booking requested"
    : step === "rooms"
      ? "Select Guests & Rooms"
      : step === "travelers"
        ? "Traveler Details"
        : "Payment";

  const update = (id: string, change: (r: Room) => Room) => onRooms(rooms.map((r) => (r.id === id ? change(r) : r)));

  function goToPayment() {
    setShowErrors(true);
    if (Object.keys(detailErrors).length > 0) {
      requestAnimationFrame(() => {
        const first = panelRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]');
        first?.scrollIntoView({ block: "center" });
        first?.focus();
      });
      return;
    }
    setSubmit({ kind: "idle" });
    setStep("payment");
  }

  async function confirmBooking() {
    if (!method || submit.kind === "sending") return;
    setSubmit({ kind: "sending" });
    const result = await bookDeparture({
      itineraryId,
      departureId: departure.id,
      startDate: departure.startDate,
      travelers,
      rooms: roomCount,
      details: draftToDetails(draft, rooms),
    });
    if (result.kind === "ok") {
      clearSaved(departure.id);
      setSubmit({ kind: "done", id: result.id, reference: result.reference });
    } else if (result.kind === "login") setSubmit({ kind: "login" });
    else setSubmit({ kind: "error", message: result.message });
  }

  const backButton = "shrink-0 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 transition-colors hover:bg-stone-50";
  const nextButton =
    "flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-900 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-brand-800 disabled:cursor-not-allowed disabled:bg-stone-300";

  return createPortal(
    <div className="fixed inset-0 z-[60]">
      <button
        type="button"
        aria-label="Close booking"
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
        className={`absolute inset-y-0 right-0 flex w-full flex-col bg-white shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none md:w-[26rem] md:max-w-[90vw] lg:w-[27rem] ${
          shown ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-start justify-between gap-4 px-4 pb-1 pt-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gold-700">
              Booking &middot; {done ? "Done" : `Step ${stepNumber} of 3`}
            </p>
            <h2 id={titleId} className="mt-0.5 font-display text-xl font-bold text-brand-950">
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

        {/* data-lenis-prevent: the site's smooth-scroll swallows mouse-wheel events
            everywhere else while this panel is open, so without it the wheel
            does nothing and the panel can only be scrolled by dragging its bar. */}
        <div data-lenis-prevent className="flex-1 overflow-y-auto overscroll-contain px-4 pb-4">
          {done && submit.kind === "done" ? (
            <Confirmation
              reference={submit.reference}
              bookingId={submit.id}
              method={method}
              copy={paymentCopy}
              tripTitle={tripTitle}
              startDate={departure.startDate}
              endDate={departure.endDate}
              travelers={travelers}
            />
          ) : step === "rooms" ? (
            <>
              <p className="mt-1.5 text-xs leading-relaxed text-stone-800">
                If you require more than {MAX_ROOMS} rooms or more than {MAX_BEDS_PER_ROOM} beds per room please{" "}
                <Link href="/contact" className="font-semibold text-gold-700 underline underline-offset-2 hover:text-gold-800">
                  contact us
                </Link>
                .
              </p>

              <ul className="mt-2.5 space-y-2">
                {rooms.map((room, i) => (
                  <li key={room.id} className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between gap-3 bg-gold-50 px-3 py-1.5">
                      <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-950">
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

                    <div className="divide-y divide-stone-200 px-3">
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
                onClick={() => onRooms([...rooms, newRoom(1)])}
                disabled={!canAddRoom(rooms, maxTravelers)}
                className="mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gold-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-gold-700 transition-colors hover:bg-gold-50 disabled:cursor-not-allowed disabled:border-stone-300 disabled:text-stone-400 disabled:hover:bg-transparent"
              >
                <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
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
            <PaymentStep
              draft={draft}
              method={method}
              onMethod={(m) => setDraft((d) => ({ ...d, paymentMethod: m }))}
              copy={paymentCopy}
              submit={submit}
              loginNext={loginNext}
              tripTitle={tripTitle}
              tripImage={tripImage}
              departure={departure}
              travelers={travelers}
              rooms={roomCount}
            />
          )}
        </div>

        <div className="border-t border-stone-200 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2.5">
          {done ? (
            <button type="button" onClick={close} className={nextButton}>
              Close
            </button>
          ) : (
            <>
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
              {step === "payment" && !method && submit.kind === "idle" && (
                <p className="mb-2 text-xs text-stone-600">Choose how you will pay to confirm your booking.</p>
              )}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={() => (step === "rooms" ? close() : setStep(step === "payment" ? "travelers" : "rooms"))}
                  disabled={submit.kind === "sending"}
                  className={backButton}
                >
                  {step === "rooms" ? "Cancel" : "Back"}
                </button>
                {step === "payment" ? (
                  <button type="button" onClick={confirmBooking} disabled={!method || submit.kind === "sending"} className={nextButton}>
                    {submit.kind === "sending" ? "Booking…" : "Confirm booking"}
                    {submit.kind !== "sending" && <ArrowIcon />}
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={step === "rooms" && !valid}
                    onClick={() => {
                      if (step === "rooms") {
                        onContinue(rooms);
                        setShowErrors(false);
                        setStep("travelers");
                      } else goToPayment();
                    }}
                    className={nextButton}
                  >
                    Continue
                    <ArrowIcon />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

function ArrowIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 py-1.5">
      <div>
        <p className="text-sm font-medium leading-tight text-stone-900">{label}</p>
        {hint && <p className="text-[11px] leading-snug text-stone-600">{hint}</p>}
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
    "flex h-9 w-9 items-center justify-center rounded-lg border border-stone-300 bg-white text-stone-900 shadow-sm transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:text-stone-300 disabled:shadow-none disabled:hover:bg-white md:h-8 md:w-8";
  return (
    <div className="flex items-center gap-2.5">
      <button type="button" aria-label={`Decrease ${label}`} disabled={value <= min} onClick={() => onChange(value - 1)} className={btn}>
        <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span aria-live="polite" aria-label={`${value} ${label}`} className="w-4 text-center text-base font-bold text-stone-900">
        {value}
      </span>
      <button type="button" aria-label={`Increase ${label}`} disabled={value >= max || !canIncrease} onClick={() => onChange(value + 1)} className={btn}>
        <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
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
  compact = false,
}: {
  title: string;
  image: string | null;
  startDate: string;
  endDate: string;
  travelers: number;
  rooms: number;
  pricePerPerson: number;
  /** For the payment step, where the choices below need the room: no photo, no tag. */
  compact?: boolean;
}) {
  return (
    <section aria-label="Trip summary" className={`${compact ? "mt-1" : "mt-3"} rounded-xl bg-stone-50 p-3`}>
      {!compact && (
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-display text-lg font-bold leading-tight text-brand-950">Trip Summary</h3>
          <span className="rounded-full bg-gold-100 px-2 py-0.5 text-[10px] font-bold text-gold-800">Selected departure</span>
        </div>
      )}
      <div className={`${compact ? "" : "mt-2"} flex gap-3`}>
        {/* Dropped on short screens so the whole summary stays in view. */}
        {!compact && (
          <div className="relative h-14 w-11 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-brand-600 to-brand-950 [@media(max-height:700px)]:hidden">
            {image && <Image src={image} alt="" fill unoptimized sizes="44px" className="object-cover" />}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-display text-sm font-bold leading-snug text-brand-950">{title}</p>
          <ul className="mt-1 space-y-0.5 text-xs text-stone-800">
            <li className="flex items-center gap-1.5">
              <span className="text-stone-600">
                <CalendarIcon />
              </span>
              {dateRangeLabel(startDate, endDate)}
              <span className="text-stone-400">&middot;</span>
              {durationLabel(startDate, endDate)}
            </li>
            <li className="flex items-center gap-1.5">
              <span className="text-stone-600">
                <PersonIcon />
              </span>
              {travelers} Traveler{travelers === 1 ? "" : "s"}
              <span className="text-stone-400">&middot;</span>
              <span className="text-stone-600">
                <BedIcon className="h-4 w-4" />
              </span>
              {rooms} Room{rooms === 1 ? "" : "s"}
            </li>
          </ul>
        </div>
      </div>

      <dl className="mt-2 space-y-0.5 border-t border-stone-200 pt-1.5 text-xs">
        <div className="flex items-center justify-between">
          <dt className="text-stone-700">Price per person</dt>
          <dd className="font-semibold text-stone-900">
            <Money btn={pricePerPerson} />
          </dd>
        </div>
        <div className="flex items-center justify-between text-sm">
          <dt className="font-bold text-stone-900">Estimated total</dt>
          <dd className="font-bold text-brand-950">
            <Money btn={pricePerPerson * travelers} />
          </dd>
        </div>
      </dl>
      {!compact && (
        <p className="mt-1 text-[10px] leading-snug text-stone-600">
          Final price may vary based on room configuration and applicable supplements. Nothing is charged at this step.
        </p>
      )}
    </section>
  );
}

/**
 * Step 3: how will you pay. Three plain choices with what happens next for
 * each (wording editable in the admin), then Confirm booking in the footer.
 */
function PaymentStep({
  draft,
  method,
  onMethod,
  copy,
  submit,
  loginNext,
  tripTitle,
  tripImage,
  departure,
  travelers,
  rooms,
}: {
  draft: TravelerDraft;
  method: (typeof PAYMENT_METHODS)[number] | null;
  onMethod: (m: (typeof PAYMENT_METHODS)[number]) => void;
  copy: PaymentCopy;
  submit: Submit;
  loginNext: string;
  tripTitle: string;
  tripImage: string | null;
  departure: Departure;
  travelers: number;
  rooms: number;
}) {
  return (
    <div className="mt-2 space-y-2.5">
      <TripSummary
        compact
        title={tripTitle}
        image={tripImage}
        startDate={departure.startDate}
        endDate={departure.endDate}
        travelers={travelers}
        rooms={rooms}
        pricePerPerson={departure.price}
      />

      <p className="text-[11px] leading-snug text-stone-700">
        Booking for <strong className="text-stone-900">{draft.travelers[0]?.firstName} {draft.travelers[0]?.lastName}</strong>
        {travelers > 1 ? ` and ${travelers - 1} other${travelers > 2 ? "s" : ""}` : ""} &middot; {draft.email}
      </p>

      <fieldset>
        <legend className="text-sm font-bold text-brand-950">How would you like to pay?</legend>
        <div className="mt-1.5 space-y-1.5">
          {PAYMENT_METHODS.map((m) => {
            const selected = method === m;
            return (
              <label
                key={m}
                className={`flex cursor-pointer items-start gap-2.5 rounded-xl border-2 px-3 py-2 transition-colors ${
                  selected ? "border-brand-800 bg-brand-50" : "border-stone-200 bg-white hover:bg-stone-50"
                }`}
              >
                <input
                  type="radio"
                  name="payment-method"
                  value={m}
                  checked={selected}
                  onChange={() => onMethod(m)}
                  className="mt-0.5 h-4 w-4 shrink-0 text-brand-900"
                />
                <span>
                  <span className="block text-sm font-semibold text-stone-900">{PAYMENT_LABEL[m]}</span>
                  {/* On very short screens only the chosen method keeps its explanation, so the
                      three choices and the buttons all stay in view. */}
                  <span className={`block text-[11px] leading-snug text-stone-700 ${selected ? "" : "[@media(max-height:640px)]:hidden"}`}>
                    {copy.methods[m]}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <p className="text-[11px] leading-snug text-stone-700">{copy.intro}</p>

      <div aria-live="polite" className="empty:hidden">
        {submit.kind === "login" && (
          <p className="rounded-lg bg-amber-50 px-3 py-2.5 text-sm text-amber-800">
            Please{" "}
            <Link href={`/login?next=${loginNext}`} className="font-semibold underline">
              log in
            </Link>{" "}
            or{" "}
            <Link href={`/register?next=${loginNext}`} className="font-semibold underline">
              create a free account
            </Link>{" "}
            to confirm. Your rooms, details and payment choice are kept, and you&apos;ll come straight back.
          </p>
        )}
        {submit.kind === "error" && <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700">{submit.message}</p>}
      </div>
    </div>
  );
}

/** What the traveler sees once the booking is in. */
function Confirmation({
  reference,
  bookingId,
  method,
  copy,
  tripTitle,
  startDate,
  endDate,
  travelers,
}: {
  reference: string;
  bookingId: string;
  method: (typeof PAYMENT_METHODS)[number] | null;
  copy: PaymentCopy;
  tripTitle: string;
  startDate: string;
  endDate: string;
  travelers: number;
}) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-emerald-600 text-white">
          <svg aria-hidden viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </span>
        <p className="mt-2 text-sm font-bold text-emerald-950">Thank you, your booking is requested</p>
        <p className="mt-1 text-xs text-emerald-900">
          Reference <strong className="font-mono text-sm">{reference}</strong>
        </p>
      </div>

      <dl className="space-y-1 rounded-xl bg-stone-50 p-3 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Trip</dt>
          <dd className="text-right font-medium text-stone-900">{tripTitle}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Dates</dt>
          <dd className="font-medium text-stone-900">{dateRangeLabel(startDate, endDate)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-stone-600">Travelers</dt>
          <dd className="font-medium text-stone-900">{travelers}</dd>
        </div>
        {method && (
          <div className="flex justify-between gap-3">
            <dt className="text-stone-600">Payment</dt>
            <dd className="font-medium text-stone-900">{PAYMENT_LABEL[method]}</dd>
          </div>
        )}
      </dl>

      <div>
        <h3 className="text-sm font-bold text-brand-950">What happens next</h3>
        <p className="mt-1 text-xs leading-relaxed text-stone-800">{copy.next}</p>
        {method && <p className="mt-1.5 text-xs leading-relaxed text-stone-700">{copy.methods[method]}</p>}
      </div>

      <Link
        href={`/dashboard/bookings/${bookingId}`}
        className="inline-block rounded-full border border-brand-800 px-4 py-2 text-sm font-semibold text-brand-900 transition-colors hover:bg-brand-50"
      >
        View it in My trips →
      </Link>
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
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" {...ICON}>
      <rect x="4" y="5" width="16" height="15" rx="2" />
      <path d="M4 10h16M9 3v4M15 3v4" />
    </svg>
  );
}
function PersonIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="h-4 w-4" {...ICON}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19c.6-3.2 2.8-5 5.5-5s4.9 1.8 5.5 5M16 5.2a3 3 0 0 1 0 5.6M18 14.3c1.5.7 2.5 2.1 2.9 4.2" />
    </svg>
  );
}
