"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import LogoMark from "@/components/Logo";
import AssistantThread from "@/components/assistant/AssistantThread";
import AssistantComposer from "@/components/assistant/AssistantComposer";
import { useAssistantChat } from "@/components/assistant/useAssistantChat";

/**
 * DRUKA in a panel, opened from the floating button.
 *
 * The same assistant as /assistant — same engine, same bubbles, same package
 * cards — laid out for roughly 380px instead of a page. Anything that differs
 * between the two would be a second assistant to maintain and a second thing
 * to get wrong, so the only difference here is `compact` and the openers being
 * chips rather than the page's full rail.
 *
 * Copy comes in as props because this is mounted in the root layout, which is
 * a server component and can read the content registry; nothing here is
 * hardcoded that the agency can edit elsewhere.
 */

export type WidgetCopy = {
  name: string;
  role: string;
  greeting: string;
  placeholder: string;
  questions: string[];
};

export default function AiChatWidget({ copy }: { copy: WidgetCopy }) {
  const [open, setOpen] = useState(false);
  const { messages, busy, send, started } = useAssistantChat();
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fit = usePhoneViewportFit(open);

  // Escape closes, and focus returns to the button that opened it rather than
  // being dropped at the top of the document.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={`${copy.name} — ${copy.role}`}
          style={fit ?? undefined}
          className="fixed inset-0 z-50 flex flex-col bg-white sm:inset-auto sm:bottom-24 sm:right-6 sm:h-[min(38rem,calc(100vh-8rem))] sm:w-[23.5rem] sm:rounded-2xl sm:border sm:border-stone-200 sm:shadow-2xl"
        >
          <header className="flex shrink-0 items-center gap-3 rounded-t-none border-b border-stone-200 bg-ink-950 px-4 py-3 text-white sm:rounded-t-2xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white">
              <LogoMark className="h-full w-full object-contain p-0.5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-display text-sm font-bold tracking-wide">{copy.name}</span>
              <span className="block text-[11px] text-white/60">{copy.role}</span>
            </span>
            <Link
              href="/assistant"
              onClick={() => setOpen(false)}
              title="Open the full assistant"
              aria-label="Open the full assistant"
              className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 4h6v6M20 4l-8 8M10 5H5v14h14v-5" />
              </svg>
            </Link>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                buttonRef.current?.focus();
              }}
              aria-label="Close"
              className="rounded-lg p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </header>

          <div aria-live="polite" className="flex-1 overflow-y-auto overscroll-contain bg-stone-50 px-3 py-4">
            <AssistantThread messages={messages} busy={busy} greeting={copy.greeting} compact />

            {/* Openers, until the conversation has started — the panel's
                equivalent of the page's rail, and the reason an empty panel
                isn't a blank box. */}
            {!started && copy.questions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-[2.375rem]">
                {copy.questions.map((question) => (
                  <button
                    key={question}
                    type="button"
                    disabled={busy}
                    onClick={() => send(question)}
                    className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 transition-colors hover:border-brass-300 hover:bg-brass-50 disabled:opacity-60"
                  >
                    {question}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-stone-200 bg-white p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
            <AssistantComposer
              placeholder={copy.placeholder}
              busy={busy}
              onSend={send}
              compact
            />
          </div>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close the travel assistant" : `Ask ${copy.name}, the travel assistant`}
        className="fixed right-5 z-40 flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-stone-200 transition-transform hover:scale-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-brass-500 focus-visible:ring-offset-2 sm:right-6"
        /* Sits above a trip page's pinned booking bar, which publishes its
           height as --trip-bar-height; 0 everywhere else, so this is the usual
           offset on every other page. --viewport-bottom-inset clears mobile
           Safari's toolbar, which otherwise covers anything pinned to the
           bottom of the layout viewport — see ViewportInset. */
        style={{
          bottom:
            "calc(1.25rem + var(--trip-bar-height, 0px) + var(--viewport-bottom-inset, 0px))",
        }}
      >
        {open ? (
          <svg viewBox="0 0 24 24" className="h-5 w-5 text-stone-700" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        ) : (
          <LogoMark className="h-full w-full object-contain p-2" />
        )}
      </button>
    </>
  );
}

/**
 * Keeps the full-screen panel on a phone inside the part of the screen the
 * visitor can actually see.
 *
 * Mobile Safari does not shrink the page when the keyboard opens: it shrinks
 * the *visual* viewport and scrolls the page underneath to bring the text box
 * into view. A panel fixed to `inset: 0` is sized to the layout viewport, so
 * the keyboard covered its bottom, the page scrolled it out from under the
 * header, and the trip page showed through below the message box. Sizing the
 * panel to the visual viewport — top and height, followed on every resize and
 * scroll — puts the header at the top of what's visible and the composer
 * right above the keyboard. While it is open the page behind is locked, so
 * there is nothing underneath to scroll.
 *
 * Phones only (below the `sm` breakpoint, where the panel is full-screen); on
 * wider screens it is a floating card and this returns null.
 */
function usePhoneViewportFit(open: boolean): React.CSSProperties | null {
  const [fit, setFit] = useState<React.CSSProperties | null>(null);

  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 639px)").matches) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.__lenis?.stop();

    const viewport = window.visualViewport;
    let frame = 0;
    const measure = () => {
      frame = 0;
      if (!viewport) return;
      setFit({ top: viewport.offsetTop, height: viewport.height, bottom: "auto" });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };

    measure();
    viewport?.addEventListener("resize", schedule);
    viewport?.addEventListener("scroll", schedule);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", schedule);
      viewport?.removeEventListener("scroll", schedule);
      document.body.style.overflow = previousOverflow;
      window.__lenis?.start();
      setFit(null);
    };
  }, [open]);

  return fit;
}
