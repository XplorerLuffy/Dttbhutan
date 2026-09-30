"use client";

import { useRef, useState } from "react";

/**
 * The message box, shared by the page and the floating panel.
 *
 * Enter sends and Shift+Enter breaks the line, which is the convention every
 * messaging app has trained people on — a textarea rather than an input so the
 * second half of that is actually possible.
 */
export default function AssistantComposer({
  placeholder,
  busy,
  onSend,
  compact = false,
}: {
  placeholder: string;
  busy: boolean;
  onSend: (text: string) => void;
  compact?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);

  function submit() {
    const text = draft.trim();
    if (!text || busy) return;
    setDraft("");
    onSend(text);
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <div
        className={`flex items-end gap-2 border border-stone-200 bg-white ${
          compact ? "rounded-2xl p-1.5 pl-3" : "rounded-3xl p-2 pl-5 shadow-lg"
        }`}
      >
        <textarea
          ref={inputRef}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          rows={1}
          placeholder={placeholder}
          aria-label="Message the travel assistant"
          className={`flex-1 resize-none self-center bg-transparent text-stone-900 outline-none placeholder:text-stone-400 ${
            compact
              ? "max-h-24 min-h-[2.75rem] py-1.5 text-[13px] leading-5"
              : "max-h-40 min-h-[3.25rem] py-2 text-sm leading-6 sm:min-h-[2.75rem] sm:py-2.5"
          }`}
        />
        <button
          type="submit"
          disabled={busy || !draft.trim()}
          aria-label="Send"
          className={`flex shrink-0 items-center justify-center rounded-full bg-brass-500 text-white transition-colors hover:bg-brass-600 disabled:cursor-not-allowed disabled:opacity-40 ${
            compact ? "h-9 w-9" : "h-11 w-11"
          }`}
        >
          <svg
            viewBox="0 0 24 24"
            className={compact ? "h-4 w-4" : "h-5 w-5"}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4.5 12 20 4l-4.5 16-4-6.5L4.5 12Z" />
          </svg>
        </button>
      </div>
    </form>
  );
}
