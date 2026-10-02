"use client";

import AssistantRail, { type RailAction } from "@/components/assistant/AssistantRail";
import AssistantThread from "@/components/assistant/AssistantThread";
import AssistantComposer from "@/components/assistant/AssistantComposer";
import { useAssistantChat } from "@/components/assistant/useAssistantChat";

/**
 * The assistant's page: hero, conversation, and the rail of capabilities and
 * openers.
 *
 * There is deliberately no navigation rail of its own — the site's own header
 * is the navigation, and a second one repeating it inside the page was both
 * redundant and a second set of links to keep in step with the first.
 *
 * Every card and question in the right rail is a one-click prompt. That is the
 * part that stops this being a blank chat box: someone who doesn't know what
 * to ask can still get a useful first answer without composing a sentence.
 *
 * State is not persisted across reloads. The server keeps the thread
 * (AiConversation) for support and analytics; the visitor gets a clean start,
 * which for an anonymous page is the kinder default.
 */

export type AssistantCopy = {
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

export default function AssistantWorkspace({ copy }: { copy: AssistantCopy }) {
  const { messages, busy, send, started } = useAssistantChat();

  return (
    <div className="bg-stone-100/70">
      {/* Below xl the chat column is `display: contents`, so the hero, the
          thread, the composer and the rail are all children of this one
          column. That is what lets the composer be `sticky` against the whole
          page body — it stays pinned to the bottom of the screen while the
          visitor reads the thread or the rail, and comes to rest at the end
          instead of floating over the footer the way a `fixed` bar did. */}
      <div className="mx-auto flex max-w-[1400px] flex-col gap-4 px-4 pt-4 sm:gap-5 sm:px-6 sm:pt-6 xl:flex-row xl:p-6">
        <div className="contents xl:flex xl:min-w-0 xl:flex-1 xl:flex-col">
          <section className="relative overflow-hidden rounded-2xl bg-ink-900">
            {copy.heroImageUrl && (
              // A content-editable URL that may sit outside the next.config
              // image allowlist, which next/image would reject.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={copy.heroImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/85 via-ink-950/55 to-transparent" />
            <div className="relative px-5 py-7 sm:px-10 sm:py-14">
              <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 sm:text-[11px]">
                {copy.heroEyebrow}
              </p>
              <h1 className="mt-2 max-w-md font-display text-[1.75rem] font-bold leading-tight text-white sm:text-5xl">
                {copy.heroHeadline}
              </h1>
              <p className="mt-3 max-w-md whitespace-pre-line text-sm leading-relaxed text-white/85">
                {copy.heroSubtitle}
              </p>
            </div>
          </section>

          <div className="min-w-0 xl:mt-5 xl:flex-1">
            <AssistantThread messages={messages} busy={busy} greeting={copy.greeting} />

            {/* On a phone the rail — and its popular questions — sits below
                the whole conversation, a long scroll away from the greeting.
                These chips put the openers where the visitor is looking; from
                xl the rail is beside the thread and does that job itself. */}
            {!started && copy.questions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2 pl-[2.375rem] sm:pl-[2.875rem] xl:hidden">
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

          {/* --viewport-bottom-inset lifts it clear of mobile Safari's
              toolbar, which otherwise covers anything pinned to the bottom of
              the layout viewport — see ViewportInset. */}
          <div className="sticky bottom-[var(--viewport-bottom-inset,0px)] z-30 order-last -mx-4 border-t border-stone-200 bg-stone-100/95 px-3 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:-mx-6 sm:px-6 xl:order-none xl:bottom-4 xl:mx-0 xl:mt-6 xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
            <AssistantComposer placeholder={copy.placeholder} busy={busy} onSend={send} />
          </div>
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
          onPrompt={send}
          busy={busy}
        />
      </div>
    </div>
  );
}
