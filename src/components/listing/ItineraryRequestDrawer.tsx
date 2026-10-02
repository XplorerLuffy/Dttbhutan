"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

export type DrawerDeparture = { id: string; label: string };

type Phase =
  | { kind: "form" }
  | { kind: "sending" }
  /** `emailed` is false when the request was saved but the email couldn't go
   * out — the team sends it by hand from the enquiry instead. */
  | { kind: "sent"; email: string; emailed: boolean };

/**
 * "Download Itinerary" on a trip page, as a panel that slides in over the
 * page instead of a bare file download.
 *
 * The visitor picks a departure if they have one in mind and leaves an
 * email, and the itinerary is sent to that inbox — it is not shown in the
 * page, so the address given has to be a real one. For the agency that turns
 * an anonymous download into an enquiry with a working email to follow up.
 *
 * Each trigger owns its panel, so the page can offer it in more than one
 * place (the overview button and the sidebar link) without a shared store.
 */
export default function ItineraryRequestDrawer({
  slug,
  tripTitle,
  departures,
  triggerLabel,
  triggerClassName,
}: {
  slug: string;
  tripTitle: string;
  departures: DrawerDeparture[];
  triggerLabel: string;
  triggerClassName: string;
}) {
  const [open, setOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>({ kind: "form" });
  const [departureId, setDepartureId] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const emailId = useId();
  const departureFieldId = useId();

  const close = useCallback(() => {
    setOpen(false);
    // Opening it again after a send starts a fresh request rather than
    // reshowing the confirmation.
    setPhase((p) => (p.kind === "sent" ? { kind: "form" } : p));
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    // Lenis drives the page scroll from its own loop and would keep moving
    // the page under the panel; pausing it (and locking the body, which keeps
    // the scrollbar from jumping) leaves the panel as the only thing that
    // scrolls.
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__lenis?.stop();
    window.addEventListener("keydown", onKey);
    closeRef.current?.focus();

    return () => {
      document.body.style.overflow = previousOverflow;
      window.__lenis?.start();
      window.removeEventListener("keydown", onKey);
    };
  }, [open, close]);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (phase.kind === "sending") return;
    setError(null);
    setPhase({ kind: "sending" });

    const website = new FormData(event.currentTarget).get("website");
    try {
      const res = await fetch("/api/itinerary-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          email,
          departureId,
          website: website || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        emailed?: boolean;
        error?: string | { fieldErrors?: Record<string, string[]> };
      };
      if (!res.ok || !data.ok) {
        const message =
          typeof data.error === "string"
            ? data.error
            : (data.error?.fieldErrors?.email?.[0] ??
              "Something went wrong. Please try again.");
        setError(message);
        setPhase({ kind: "form" });
        return;
      }
      setPhase({ kind: "sent", email, emailed: data.emailed !== false });
    } catch {
      setError(
        "We couldn't reach the server. Please check your connection and try again.",
      );
      setPhase({ kind: "form" });
    }
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className={triggerClassName}
      >
        {triggerLabel}
      </button>

      {/* Portalled to <body>: the page sits inside the route-transition
          wrapper, whose transform makes `fixed` mean "fixed to the wrapper",
          which put the panel mid-page under the sticky bars. */}
      {open &&
        createPortal(
          <div className="fixed inset-0 z-[60]">
            <button
              type="button"
              aria-label="Close"
              tabIndex={-1}
              onClick={close}
              className="absolute inset-0 h-full w-full cursor-default bg-ink-950/50 backdrop-blur-[1px]"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby={titleId}
              data-lenis-prevent
              className="absolute inset-y-0 right-0 flex w-full max-w-xl flex-col overflow-y-auto overscroll-contain bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-stone-200 px-6 pb-4 pt-6 sm:px-10 sm:pt-8">
                <h2
                  id={titleId}
                  className="font-display text-2xl font-bold text-stone-900 sm:text-[1.75rem]"
                >
                  {phase.kind === "sent"
                    ? phase.emailed
                      ? "Check your inbox"
                      : "Request received"
                    : "Request a Sample Itinerary"}
                </h2>
                <button
                  ref={closeRef}
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="-mr-2 rounded-full p-2 text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900"
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>

              {phase.kind === "sent" ? (
                <div className="flex flex-1 flex-col px-6 py-8 sm:px-10">
                  <span
                    aria-hidden
                    className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-800"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.7}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="5" width="18" height="14" rx="2" />
                      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
                    </svg>
                  </span>

                  {phase.emailed ? (
                    <>
                      <p className="mt-5 text-lg leading-relaxed text-stone-800">
                        We&apos;ve sent the itinerary for{" "}
                        <strong>{tripTitle}</strong> to{" "}
                        <strong className="break-all">{phase.email}</strong>.
                      </p>
                      <p className="mt-3 leading-relaxed text-stone-600">
                        It usually arrives within a few minutes. If you
                        can&apos;t see it, check your spam or promotions folder.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-5 text-lg leading-relaxed text-stone-800">
                        Thanks — we&apos;ve got your request for{" "}
                        <strong>{tripTitle}</strong>.
                      </p>
                      <p className="mt-3 leading-relaxed text-stone-600">
                        We couldn&apos;t send the email automatically just now,
                        so our team will email the itinerary to{" "}
                        <strong className="break-all">{phase.email}</strong>{" "}
                        within one working day.
                      </p>
                    </>
                  )}

                  <div className="mt-8 flex flex-wrap items-center gap-4">
                    <button
                      type="button"
                      onClick={close}
                      className="rounded-full bg-brand-900 px-8 py-3 font-semibold text-white transition-colors hover:bg-brand-800"
                    >
                      Done
                    </button>
                    <button
                      type="button"
                      onClick={() => setPhase({ kind: "form" })}
                      className="text-sm font-semibold text-brand-700 hover:underline"
                    >
                      Send to a different email
                    </button>
                  </div>
                </div>
              ) : (
                <form
                  onSubmit={submit}
                  noValidate
                  className="flex flex-1 flex-col px-6 py-6 sm:px-10"
                >
                  <p className="leading-relaxed text-stone-700">
                    Itineraries include a detailed description of each day,
                    where you stay, what&apos;s included, regional highlights
                    and the dates the trip runs. It&apos;s the perfect tool to
                    help you choose!
                  </p>
                  <p className="mt-5 leading-relaxed text-stone-700">
                    {departures.length > 0
                      ? "Not sure of your travel date? Select any departure and we'll email you a sample itinerary to read at your leisure."
                      : "This trip runs privately on dates that suit you. Leave your email and we'll send you the full itinerary to read at your leisure."}
                  </p>

                  {departures.length > 0 && (
                    <div className="mt-7">
                      <label htmlFor={departureFieldId} className="sr-only">
                        Departure date
                      </label>
                      <div className="relative">
                        <select
                          id={departureFieldId}
                          value={departureId}
                          onChange={(e) => setDepartureId(e.target.value)}
                          className={`w-full appearance-none rounded-lg border border-stone-300 bg-white px-4 py-3.5 pr-12 text-base outline-none transition-colors focus:border-brand-700 focus:ring-2 focus:ring-brand-700/20 ${
                            departureId ? "text-stone-900" : "text-stone-400"
                          }`}
                        >
                          <option value="">Select a departure date</option>
                          {departures.map((d) => (
                            <option
                              key={d.id}
                              value={d.id}
                              className="text-stone-900"
                            >
                              {d.label}
                            </option>
                          ))}
                        </select>
                        <svg
                          aria-hidden
                          viewBox="0 0 24 24"
                          className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-stone-700"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth={1.8}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="m6 9 6 6 6-6" />
                        </svg>
                      </div>
                    </div>
                  )}

                  <div className="mt-7">
                    <label
                      htmlFor={emailId}
                      className="text-xs font-bold uppercase tracking-wide text-stone-900"
                    >
                      Email
                      <span className="text-red-600" aria-hidden>
                        {" "}
                        *
                      </span>
                    </label>
                    <input
                      id={emailId}
                      type="email"
                      required
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      aria-invalid={error ? true : undefined}
                      aria-describedby={error ? `${emailId}-error` : undefined}
                      className="mt-2 w-full border-0 border-b border-stone-300 bg-transparent px-0 py-2.5 text-base text-stone-900 outline-none placeholder:text-stone-400 focus:border-brand-700 focus:ring-0"
                    />
                    {error && (
                      <p
                        id={`${emailId}-error`}
                        role="alert"
                        className="mt-2 text-sm text-red-700"
                      >
                        {error}
                      </p>
                    )}
                  </div>

                  {/* Honeypot: hidden from people, irresistible to form bots. */}
                  <input
                    type="text"
                    name="website"
                    tabIndex={-1}
                    autoComplete="off"
                    aria-hidden
                    className="absolute -left-[9999px] h-0 w-0 opacity-0"
                  />

                  <div className="mt-8 space-y-4 text-sm leading-relaxed text-stone-600">
                    <p>
                      We&apos;re always looking for ways to improve our
                      itineraries; published trip details, including routes,
                      activities and start and end points, can change and may
                      vary by departure.
                    </p>
                    <p>
                      Please don&apos;t use this itinerary to book flights or
                      other travel. We confirm the final plan for your date in
                      writing when you book, before you pay anything.
                    </p>
                  </div>

                  <div className="mt-auto flex justify-center pb-2 pt-8">
                    <button
                      type="submit"
                      disabled={phase.kind === "sending"}
                      className="w-full max-w-xs rounded-full bg-brand-900 px-8 py-3.5 text-lg font-semibold text-white transition-colors hover:bg-brand-800 disabled:cursor-wait disabled:opacity-70"
                    >
                      {phase.kind === "sending" ? "Sending…" : "Submit"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
