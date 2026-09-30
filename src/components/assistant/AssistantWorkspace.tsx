"use client";

import { useEffect, useRef, useState } from "react";
import AssistantSidebar, { MountainMark } from "@/components/assistant/AssistantSidebar";
import AssistantRail, { type RailAction } from "@/components/assistant/AssistantRail";
import AssistantPackageCard from "@/components/assistant/AssistantPackageCard";
import AssistantRichText from "@/components/assistant/AssistantRichText";
import type { PackageCard } from "@/lib/ai/cards";

/**
 * The assistant workspace: rail, conversation, rail.
 *
 * Deliberately not the floating bubble it replaces. A bubble says "ask a
 * question if you must"; a page with a hero, stated capabilities and a set of
 * openers says planning the trip happens here. The practical difference is
 * that a visitor with nothing in mind can still start — every card and
 * question in the right rail is a one-click prompt.
 *
 * State lives here rather than in a store: one conversation, one page, and it
 * is deliberately not persisted across reloads. The server keeps the thread
 * (AiConversation) for support and analytics; the visitor gets a clean start,
 * which for an anonymous kiosk-style page is the kinder default.
 */

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: Date;
  cards?: PackageCard[];
  /** Set when this reply is the failure notice rather than an answer. */
  failed?: boolean;
};

export type AssistantCopy = {
  brandName: string;
  brandTagline: string;
  railFooter: string;
  assistantName: string;
  assistantRole: string;
  heroEyebrow: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImageUrl: string | null;
  intro: string;
  greeting: string;
  quote: string;
  closingImageUrl: string | null;
  closingLine: string;
  actions: RailAction[];
  questions: string[];
  placeholder: string;
};

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export default function AssistantWorkspace({ copy }: { copy: AssistantCopy }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const conversationId = useRef<string | null>(null);
  const threadEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Only scroll once there's a conversation: doing it on mount would skip the
  // hero, which is the first thing a visitor should see.
  useEffect(() => {
    if (messages.length === 0) return;
    threadEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;

    setDraft("");
    setBusy(true);
    setMessages((prev) => [
      ...prev,
      { id: `u-${Date.now()}`, role: "user", content: trimmed, at: new Date() },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          ...(conversationId.current ? { conversationId: conversationId.current } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        conversationId?: string;
        cards?: PackageCard[];
      };
      if (data.conversationId) conversationId.current = data.conversationId;

      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          // `error` carries a visitor-safe sentence from the route (rate
          // limit, provider down) — showing it beats a generic failure.
          content:
            data.message ??
            data.error ??
            "Something went wrong reaching me just then. Please try again.",
          at: new Date(),
          cards: data.cards ?? [],
          failed: !res.ok,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          role: "assistant",
          content: "I couldn't reach the network just then. Please check your connection and try again.",
          at: new Date(),
          failed: true,
        },
      ]);
    } finally {
      setBusy(false);
      inputRef.current?.focus();
    }
  }

  const started = messages.length > 0;

  return (
    <div className="min-h-screen bg-stone-100/70">
      <AssistantSidebar
        brandName={copy.brandName}
        tagline={copy.brandTagline}
        footerNote={copy.railFooter}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
      />

      <div className="lg:pl-64">
        {/* Phone header — the rail is a drawer below lg. */}
        <div className="flex items-center gap-3 bg-ink-950 px-4 py-3 text-white lg:hidden">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-2 hover:bg-white/10"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </button>
          <MountainMark className="h-5 w-auto text-brass-400" />
          <span className="font-display text-sm font-bold tracking-wide">{copy.brandName}</span>
        </div>

        <div className="mx-auto flex max-w-[1500px] flex-col gap-5 p-4 pb-28 sm:p-6 sm:pb-28 xl:flex-row xl:pb-6">
          <div className="flex min-w-0 flex-1 flex-col">
            <section className="relative overflow-hidden rounded-2xl bg-ink-900">
              {copy.heroImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={copy.heroImageUrl}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-transparent" />
              <div className="relative px-6 py-10 sm:px-10 sm:py-14">
                <p className="text-[11px] uppercase tracking-[0.2em] text-white/70">
                  {copy.heroEyebrow}
                </p>
                <h1 className="mt-2 max-w-md font-display text-3xl font-bold leading-tight text-white sm:text-5xl">
                  {copy.heroHeadline}
                </h1>
                <p className="mt-3 max-w-md whitespace-pre-line text-sm leading-relaxed text-white/85">
                  {copy.heroSubtitle}
                </p>
              </div>
            </section>

            <div className="mt-5 flex-1 space-y-5">
              {!started && (
                <Bubble role="assistant" at={null}>
                  <AssistantRichText text={copy.greeting} />
                </Bubble>
              )}

              {messages.map((message) =>
                message.role === "user" ? (
                  <Bubble key={message.id} role="user" at={message.at}>
                    <p className="whitespace-pre-line">{message.content}</p>
                  </Bubble>
                ) : (
                  <Bubble key={message.id} role="assistant" at={message.at} failed={message.failed}>
                    <AssistantRichText text={message.content} />
                    {message.cards?.map((card) => (
                      <AssistantPackageCard key={card.slug} card={card} />
                    ))}
                  </Bubble>
                )
              )}

              {busy && (
                <Bubble role="assistant" at={null}>
                  <span className="flex items-center gap-1.5" aria-label="Thinking">
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-2 w-2 animate-bounce rounded-full bg-stone-400"
                        style={{ animationDelay: `${i * 120}ms` }}
                      />
                    ))}
                  </span>
                </Bubble>
              )}

              <div ref={threadEnd} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send(draft);
              }}
              /* Pinned to the viewport on phones, where the right rail follows
                 the conversation in the stack and a merely sticky composer
                 would scroll away above it. From xl the three columns sit
                 side by side and sticky-within-column is the right behaviour. */
              className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-stone-100/95 p-3 backdrop-blur xl:sticky xl:inset-x-auto xl:bottom-4 xl:mt-6 xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none"
            >
              <div className="flex items-end gap-2 rounded-3xl border border-stone-200 bg-white p-2 pl-5 shadow-lg">
                <textarea
                  ref={inputRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter sends, Shift+Enter breaks the line — the
                    // convention every messaging app has trained people on.
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void send(draft);
                    }
                  }}
                  rows={1}
                  placeholder={copy.placeholder}
                  aria-label="Message the travel assistant"
                  className="max-h-40 min-h-[3.25rem] flex-1 resize-none self-center bg-transparent py-2 text-sm leading-6 text-stone-900 outline-none placeholder:text-stone-400 sm:min-h-[2.75rem] sm:py-2.5"
                />
                <button
                  type="submit"
                  disabled={busy || !draft.trim()}
                  aria-label="Send"
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass-500 text-white transition-colors hover:bg-brass-600 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4.5 12 20 4l-4.5 16-4-6.5L4.5 12Z" />
                  </svg>
                </button>
              </div>
            </form>
          </div>

          <AssistantRail
            name={copy.assistantName}
            role={copy.assistantRole}
            intro={copy.intro}
            actions={copy.actions}
            quote={copy.quote}
            questions={copy.questions}
            closingImageUrl={copy.closingImageUrl}
            closingLine={copy.closingLine}
            onPrompt={(prompt) => void send(prompt)}
            busy={busy}
          />
        </div>
      </div>
    </div>
  );
}

function Bubble({
  role,
  at,
  failed,
  children,
}: {
  role: "user" | "assistant";
  at: Date | null;
  failed?: boolean;
  children: React.ReactNode;
}) {
  const isUser = role === "user";

  return (
    <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        aria-hidden
        className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
          isUser ? "bg-stone-200 text-stone-500" : "bg-ink-950"
        }`}
      >
        {isUser ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
          </svg>
        ) : (
          <MountainMark className="h-4 w-auto text-brass-400" />
        )}
      </span>

      <div className={`min-w-0 max-w-[46rem] ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-3 text-left text-sm leading-relaxed ${
            isUser
              ? "bg-brass-100/70 text-stone-800"
              : failed
                ? "border border-red-200 bg-red-50 text-red-800"
                : "border border-stone-200 bg-white text-stone-800"
          }`}
        >
          {children}
        </div>
        {at && (
          <p className="mt-1 px-1 text-[11px] text-stone-400">
            {formatTime(at)}
            {isUser && <span aria-hidden className="ml-1 text-brass-500">✓✓</span>}
          </p>
        )}
      </div>
    </div>
  );
}
