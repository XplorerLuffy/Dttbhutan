import type { Metadata } from "next";
import { getSiteContent } from "@/lib/content";
import AssistantWorkspace, {
  type AssistantCopy,
} from "@/components/assistant/AssistantWorkspace";
import type { RailAction } from "@/components/assistant/AssistantRail";

/**
 * The assistant's own page — the primary way travellers use it, replacing the
 * floating bubble as the front door.
 *
 * Every word on it comes from the content registry, so the agency can rename
 * the assistant, rewrite its introduction, or change the openers without a
 * deploy. That matters more here than elsewhere: the opening questions are the
 * page's main navigation, and which ones convert is something only the agency
 * finds out by watching real enquiries.
 */

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = await getSiteContent();
  return {
    title: `${content("assistant.name")} — ${content("assistant.role")}`,
    description: content("assistant.intro"),
    alternates: { canonical: "/assistant" },
  };
}

/** The four capability cards. Icons are chosen here rather than stored, since
 * they're presentation; the titles, subtitles and prompts are all editable. */
const ACTION_KEYS: { key: string; icon: RailAction["icon"] }[] = [
  { key: "assistant.action1", icon: "map" },
  { key: "assistant.action2", icon: "info" },
  { key: "assistant.action3", icon: "guide" },
  { key: "assistant.action4", icon: "calendar" },
];

export default async function AssistantPage() {
  const content = await getSiteContent();

  const actions: RailAction[] = ACTION_KEYS.map(({ key, icon }) => ({
    title: content(`${key}.title`),
    subtitle: content(`${key}.subtitle`),
    prompt: content(`${key}.prompt`),
    icon,
  })).filter((a) => a.title.trim().length > 0);

  // One key, one question per line — a list is what this is, and a textarea is
  // a far easier thing to edit than five separately numbered fields.
  const questions = content("assistant.questions")
    .split("\n")
    .map((q) => q.trim())
    .filter(Boolean);

  const copy: AssistantCopy = {
    assistantName: content("assistant.name"),
    assistantRole: content("assistant.role"),
    heroEyebrow: content("assistant.hero.eyebrow"),
    heroHeadline: content("assistant.hero.headline"),
    heroSubtitle: content("assistant.hero.subtitle"),
    heroImageUrl: content("assistant.hero.imageUrl").trim() || null,
    intro: content("assistant.intro"),
    greeting: content("assistant.greeting"),
    quote: content("assistant.quote"),
    closingImageUrl: content("assistant.closing.imageUrl").trim() || null,
    closingLine: content("assistant.closing.line"),
    actions,
    questions,
    placeholder: content("assistant.placeholder"),
  };

  return <AssistantWorkspace copy={copy} />;
}
