"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * Floating AI travel assistant — the real UI for POST /api/chat (see
 * src/app/api/chat/route.ts). This file only talks to that existing
 * endpoint; it never calls Ollama or any provider directly, and never
 * imports anything from src/lib/ai — the assistant's behavior, tools, and
 * safety rules live entirely server-side.
 *
 * Session handling: `conversationId` plus the visible message list are kept
 * in sessionStorage (not localStorage — this is meant to survive a refresh
 * within the same tab/session, not persist indefinitely, matching how the
 * backend itself treats a conversation: see the comment above
 * `AiConversation` in prisma/schema.prisma). No account, no PII is stored —
 * just the opaque id and the message text already visible on screen.
 */

type ChatMessage = { role: "user" | "assistant"; content: string };

const STORAGE_KEY = "droelma-ai-chat";
const GENERIC_CLIENT_ERROR = "Sorry, something went wrong. Please try again.";

const SUGGESTED_PROMPTS = [
  "Help me plan a trip",
  "Which destinations would you recommend?",
  "I want to plan a 7-day trip",
  "Tell me about your travel packages",
];

type StoredSession = { conversationId: string | null; messages: ChatMessage[] };

function loadStoredSession(): StoredSession {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return { conversationId: null, messages: [] };
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed?.messages)) {
      return {
        conversationId: typeof parsed.conversationId === "string" ? parsed.conversationId : null,
        messages: parsed.messages,
      };
    }
  } catch {
    // Corrupt or blocked storage (private browsing, blocked site data) —
    // start fresh rather than crashing the widget.
  }
  return { conversationId: null, messages: [] };
}

function saveStoredSession(session: StoredSession) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // ignore — same reasoning as CurrencyProvider.tsx
  }
}

function ChatIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8A2.5 2.5 0 0 1 17.5 16H10l-4.5 4v-4H6.5A2.5 2.5 0 0 1 4 13.5v-8Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SendIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 12h15M13 6l6 6-6 6" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-stone-100 px-3 py-2.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-stone-400"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

export default function AiChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Restore the visible conversation (if any) once, on mount.
  useEffect(() => {
    const stored = loadStoredSession();
    if (stored.conversationId || stored.messages.length > 0) {
      setConversationId(stored.conversationId);
      setMessages(stored.messages);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, isLoading]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  // Escape closes the panel, same as the mobile nav's own overlay pattern.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  async function send(rawText: string) {
    const text = rawText.trim();
    if (!text || isLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(nextMessages);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, ...(conversationId ? { conversationId } : {}) }),
      });
      const data = await res.json().catch(() => null);

      // conversationId comes back on both success and most error responses
      // (route.ts includes it once a conversation row exists) — pick it up
      // either way so a retry after a transient error still continues the
      // same thread instead of silently starting a new one.
      const nextConversationId =
        typeof data?.conversationId === "string" ? data.conversationId : conversationId;

      if (res.ok && typeof data?.message === "string") {
        const finalMessages: ChatMessage[] = [...nextMessages, { role: "assistant", content: data.message }];
        setMessages(finalMessages);
        setConversationId(nextConversationId);
        saveStoredSession({ conversationId: nextConversationId, messages: finalMessages });
      } else {
        // 429/503/500 all send a plain, safe { error: string }; 400 sends a
        // zod error object instead — the string check below is what keeps
        // that raw validation object from ever reaching the screen.
        setError(typeof data?.error === "string" ? data.error : GENERIC_CLIENT_ERROR);
        setConversationId(nextConversationId);
        saveStoredSession({ conversationId: nextConversationId, messages: nextMessages });
      }
    } catch {
      // fetch itself threw — offline, or the server couldn't be reached at
      // all. Never surface the raw error (it can contain a URL).
      setError(GENERIC_CLIENT_ERROR);
      saveStoredSession({ conversationId, messages: nextMessages });
    } finally {
      setIsLoading(false);
    }
  }

  function handleInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const hasMessages = messages.length > 0;

  return (
    <>
      <AnimatePresence>
        {!open && (
          <motion.button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open the trip planning assistant"
            aria-haspopup="dialog"
            aria-expanded={open}
            className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand-700 text-white shadow-lg hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:bottom-6 sm:right-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1, scale: 1 }
                : { opacity: 1, scale: [1, 1.06, 1] }
            }
            exit={{ opacity: 0, scale: 0.8 }}
            transition={
              prefersReducedMotion
                ? { duration: 0.15 }
                : {
                    // A few gentle pulses to draw the eye on first paint,
                    // then settle at rest — an infinite loop here would
                    // never let the button's transform stabilize, which
                    // reads as distracting motion rather than "subtle,"
                    // and stops it from ever being reliably clickable by
                    // automated tools that wait for layout to settle.
                    scale: { duration: 1.1, repeat: 2, ease: "easeInOut" },
                    opacity: { duration: 0.15 },
                  }
            }
            whileHover={prefersReducedMotion ? undefined : { scale: 1.08 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.94 }}
          >
            <ChatIcon className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="ai-chat-heading"
            className="fixed inset-3 z-50 flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[36rem] sm:max-h-[80vh] sm:w-[400px]"
            initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            animate={prefersReducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="flex shrink-0 items-center justify-between gap-3 bg-brand-700 px-4 py-3 text-white">
              <div className="min-w-0">
                <h2 id="ai-chat-heading" className="truncate font-display text-base font-semibold">
                  Trip Planning Assistant
                </h2>
                <p className="truncate text-xs text-white/80">Ask about destinations, packages, and prices</p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close the trip planning assistant"
                className="shrink-0 rounded-md p-1.5 hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <CloseIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Messages */}
            <div aria-live="polite" className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {!hasMessages && (
                <p className="text-sm text-stone-600">
                  Hi! I can help you plan a trip to Bhutan — ask about destinations, tour packages, guides, or
                  prices, and I&apos;ll pull real answers from what we actually offer.
                </p>
              )}
              {messages.map((m, i) => (
                <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
                  <p
                    className={
                      m.role === "user"
                        ? "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-700 px-3 py-2 text-sm text-white"
                        : "max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-stone-100 px-3 py-2 text-sm text-stone-800"
                    }
                  >
                    {m.content}
                  </p>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}
              {error && (
                <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggested prompts — only before the conversation starts */}
            {!hasMessages && (
              <div className="shrink-0 border-t border-stone-100 px-3 pb-2 pt-3">
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_PROMPTS.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => send(prompt)}
                      disabled={isLoading}
                      className="rounded-full border border-stone-300 px-3 py-1.5 text-xs text-stone-600 hover:border-brand-400 hover:text-brand-700 disabled:opacity-50"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input */}
            <div className="flex shrink-0 items-center gap-2 border-t border-stone-200 p-3">
              <label htmlFor="ai-chat-input" className="sr-only">
                Message the trip planning assistant
              </label>
              <input
                id="ai-chat-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={isLoading}
                maxLength={2000}
                placeholder="Ask about a trip to Bhutan..."
                className="input flex-1"
              />
              <button
                type="button"
                onClick={() => send(input)}
                disabled={isLoading || !input.trim()}
                aria-label="Send message"
                className="btn-primary shrink-0 px-3 py-2"
              >
                <SendIcon className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
