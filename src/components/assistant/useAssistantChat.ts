"use client";

import { useCallback, useRef, useState } from "react";
import type { PackageCard } from "@/lib/ai/cards";

/**
 * One conversation with DRUKA.
 *
 * Shared by the two places it can be held: the full page at /assistant and the
 * floating panel on every other page. They differ only in how much room they
 * have — the turn-taking, the failure handling and the package cards are the
 * same thing, and were duplicated before this existed.
 */

export type AssistantMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  at: Date;
  cards?: PackageCard[];
  /** True when this is a failure notice rather than an answer, so it can be
   * styled as one instead of passing for something DRUKA said. */
  failed?: boolean;
};

export function useAssistantChat() {
  const [messages, setMessages] = useState<AssistantMessage[]>([]);
  const [busy, setBusy] = useState(false);
  const conversationId = useRef<string | null>(null);
  /** A ref, not the `busy` state, so `send` can keep empty deps and stay a
   * stable identity across turns while still refusing to overlap them. */
  const sending = useRef(false);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending.current) return;

      sending.current = true;
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
            // `error` is a visitor-safe sentence from the route (rate limited,
            // provider unreachable) — saying which is better than a shrug.
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
            content:
              "I couldn't reach the network just then. Please check your connection and try again.",
            at: new Date(),
            failed: true,
          },
        ]);
      } finally {
        sending.current = false;
        setBusy(false);
      }
    },
    []
  );

  return { messages, busy, send, started: messages.length > 0 };
}
