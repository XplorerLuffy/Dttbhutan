"use client";

import { useEffect, useRef } from "react";
import LogoMark from "@/components/Logo";
import AssistantPackageCard from "@/components/assistant/AssistantPackageCard";
import AssistantRichText from "@/components/assistant/AssistantRichText";
import type { AssistantMessage } from "@/components/assistant/useAssistantChat";

/**
 * The conversation itself — shared by the full page and the floating panel, so
 * a reply looks and behaves identically wherever it is read.
 *
 * `compact` is the panel's variant: the same bubbles and the same package
 * cards, with tighter spacing and smaller avatars, because roughly 380px of
 * width does not take the page's measurements.
 */
export default function AssistantThread({
  messages,
  busy,
  greeting,
  compact = false,
}: {
  messages: AssistantMessage[];
  busy: boolean;
  greeting: string;
  compact?: boolean;
}) {
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Nothing to follow before the first exchange — on the page, scrolling on
    // mount would skip the hero, which is the first thing to see.
    if (messages.length === 0) return;
    end.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  return (
    <div className={compact ? "space-y-3" : "space-y-5"}>
      <Bubble role="assistant" at={null} compact={compact}>
        <AssistantRichText text={greeting} />
      </Bubble>

      {messages.map((message) => (
        <Bubble
          key={message.id}
          role={message.role}
          at={message.at}
          failed={message.failed}
          compact={compact}
        >
          {message.role === "user" ? (
            <p className="whitespace-pre-line">{message.content}</p>
          ) : (
            <>
              <AssistantRichText text={message.content} />
              {message.cards?.map((card) => (
                <AssistantPackageCard key={card.slug} card={card} compact={compact} />
              ))}
            </>
          )}
        </Bubble>
      ))}

      {busy && (
        <Bubble role="assistant" at={null} compact={compact}>
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

      <div ref={end} />
    </div>
  );
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function Bubble({
  role,
  at,
  failed,
  compact,
  children,
}: {
  role: "user" | "assistant";
  at: Date | null;
  failed?: boolean;
  compact?: boolean;
  children: React.ReactNode;
}) {
  const isUser = role === "user";
  const avatar = compact ? "h-7 w-7" : "h-9 w-9";

  return (
    <div className={`flex items-start gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}>
      <span
        aria-hidden
        className={`mt-1 flex shrink-0 items-center justify-center overflow-hidden rounded-full ${avatar} ${
          isUser ? "bg-stone-200 text-stone-500" : "bg-white ring-1 ring-stone-200"
        }`}
      >
        {isUser ? (
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={1.7}>
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 19a6.5 6.5 0 0 1 13 0" />
          </svg>
        ) : (
          <LogoMark className="h-full w-full object-contain p-0.5" />
        )}
      </span>

      <div className={`min-w-0 ${compact ? "max-w-[85%]" : "max-w-[46rem]"} ${isUser ? "text-right" : ""}`}>
        <div
          className={`inline-block rounded-2xl text-left leading-relaxed ${
            compact ? "px-3 py-2 text-[13px]" : "px-4 py-3 text-sm"
          } ${
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
            {isUser && (
              <span aria-hidden className="ml-1 text-brass-500">
                ✓✓
              </span>
            )}
          </p>
        )}
      </div>
    </div>
  );
}
