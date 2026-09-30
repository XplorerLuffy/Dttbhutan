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
  const { messages, busy, send } = useAssistantChat();

  return (
    <div className="bg-stone-100/70">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-5 p-4 pb-28 sm:p-6 sm:pb-28 xl:flex-row xl:pb-6">
        <div className="flex min-w-0 flex-1 flex-col">
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

          <div className="mt-5 flex-1">
            <AssistantThread messages={messages} busy={busy} greeting={copy.greeting} />
          </div>

          {/* Pinned to the viewport on phones, where the rail follows the
              conversation in the stack and a merely sticky composer would
              scroll away above it. From xl the columns sit side by side and
              sticky-within-column is the right behaviour. */}
          <div className="fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-stone-100/95 p-3 backdrop-blur xl:sticky xl:inset-x-auto xl:bottom-4 xl:mt-6 xl:border-0 xl:bg-transparent xl:p-0 xl:backdrop-blur-none">
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
