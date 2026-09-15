"use client";

import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  body: string;
  createdAt: string;
  sender: { name: string; role: string };
};

export default function MessageThread({
  bookingId,
  initialMessages,
  currentUserName,
}: {
  bookingId: string;
  initialMessages: Message[];
  currentUserName: string;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [isSending, setIsSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length]);

  async function send() {
    if (!draft.trim()) return;
    setIsSending(true);
    const res = await fetch(`/api/bookings/${bookingId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: draft }),
    });
    setIsSending(false);
    if (res.ok) {
      const message = await res.json();
      setMessages((prev) => [...prev, message]);
      setDraft("");
    }
  }

  return (
    <div className="card">
      <h3 className="mb-3 font-semibold">Messages</h3>
      <div className="mb-3 max-h-72 space-y-2 overflow-y-auto">
        {messages.length === 0 && (
          <p className="text-sm text-stone-500">No messages yet.</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="rounded-md bg-stone-100 px-3 py-2 text-sm">
            <p className="font-medium">
              {m.sender.name}
              {m.sender.name === currentUserName ? " (you)" : ""}
            </p>
            <p>{m.body}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Write a message..."
          className="input"
        />
        <button
          type="button"
          disabled={isSending}
          onClick={send}
          className="btn-primary shrink-0"
        >
          Send
        </button>
      </div>
    </div>
  );
}
