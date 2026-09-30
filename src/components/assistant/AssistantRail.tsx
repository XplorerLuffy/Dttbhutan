"use client";

import LogoMark from "@/components/Logo";

/**
 * The right-hand rail: who the assistant is, what it can do, and a way in for
 * anyone who doesn't know what to type.
 *
 * The capability cards and the popular questions are both prompts in disguise
 * — clicking one sends it as a message. That is the part that stops this
 * reading as a blank chat box: a visitor who has nothing in mind can still get
 * a useful first answer without composing a sentence.
 */

export type RailAction = { title: string; subtitle: string; prompt: string; icon: IconName };
export type IconName = "map" | "info" | "guide" | "calendar";

export default function AssistantRail({
  name,
  role,
  intro,
  actions,
  quote,
  questions,
  closingImageUrl,
  closingLine,
  onPrompt,
  busy,
}: {
  name: string;
  role: string;
  intro: string;
  actions: RailAction[];
  quote: string;
  questions: string[];
  closingImageUrl: string | null;
  closingLine: string;
  onPrompt: (prompt: string) => void;
  busy: boolean;
}) {
  return (
    <aside className="w-full shrink-0 space-y-4 xl:w-[21rem]">
      <div className="rounded-2xl border border-stone-200 bg-white p-5">
        <div className="flex flex-col items-center text-center">
          <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-stone-200">
            <LogoMark className="h-full w-full object-contain p-1.5" />
          </span>
          <p className="mt-3 font-display text-xl font-bold tracking-wide text-stone-900">{name}</p>
          <p className="text-xs text-stone-500">{role}</p>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-stone-600">{intro}</p>

        <div className="mt-4 space-y-2">
          {actions.map((action) => (
            <button
              key={action.title}
              type="button"
              disabled={busy}
              onClick={() => onPrompt(action.prompt)}
              className="flex w-full items-center gap-3 rounded-xl border border-stone-200 p-3 text-left transition-colors hover:border-brass-300 hover:bg-brass-50/60 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span
                aria-hidden
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-stone-100 text-stone-600"
              >
                <ActionIcon name={action.icon} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-stone-900">{action.title}</span>
                <span className="block text-xs text-stone-500">{action.subtitle}</span>
              </span>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-start gap-3 rounded-xl bg-brass-100/60 p-4">
          <LogoMark className="mt-0.5 h-5 w-5 shrink-0 object-contain" />
          <p className="whitespace-pre-line font-display text-xs italic leading-relaxed text-brass-700">
            {quote}
          </p>
        </div>

        {questions.length > 0 && (
          <div className="mt-5">
            <p className="mb-2 font-display text-sm font-bold text-stone-900">Popular questions</p>
            <ul className="space-y-2">
              {questions.map((question) => (
                <li key={question}>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => onPrompt(question)}
                    className="flex w-full items-center gap-2 rounded-lg border border-stone-200 px-3 py-2.5 text-left text-xs text-stone-700 transition-colors hover:border-brass-300 hover:bg-brass-50/60 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <ClockIcon />
                    <span className="min-w-0 flex-1">{question}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {closingImageUrl && (
        <div className="relative overflow-hidden rounded-2xl">
          {/* Decorative, and an admin-entered URL that may sit outside the
              next.config image allowlist — so a plain <img>, not next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={closingImageUrl} alt="" className="h-40 w-full object-cover" />
          <div className="absolute inset-0 bg-ink-950/45" />
          <p className="absolute inset-0 flex items-center justify-center px-6 text-center font-display text-base italic leading-snug text-white">
            {closingLine}
          </p>
        </div>
      )}
    </aside>
  );
}

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function ActionIcon({ name }: { name: IconName }) {
  switch (name) {
    case "map":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
          <path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4Z" />
          <path d="M9 4v13M15 7v13" />
        </svg>
      );
    case "info":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 11v5M12 8.2v.2" />
        </svg>
      );
    case "guide":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
          <circle cx="12" cy="8" r="3.4" />
          <path d="M5 20a7 7 0 0 1 14 0" />
        </svg>
      );
    case "calendar":
      return (
        <svg viewBox="0 0 24 24" className="h-5 w-5" {...STROKE}>
          <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
          <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
        </svg>
      );
  }
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-stone-400" {...STROKE}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3 1.8" />
    </svg>
  );
}
