/**
 * Real answers from the live DTT Bhutan assistant.
 *
 * Every string below was returned by https://dttbhutan.vercel.app/api/chat on
 * 2026-09-30 — production, with its real system prompt, its real grounding
 * tools, and the real knowledge base behind it. Nothing here is written for the
 * video. They are recorded rather than generated live because the render
 * container cannot reach the AI provider, and a case-study video must not show
 * an answer the product did not give.
 *
 * `conversationId` is the value production actually issued. The two `family`
 * turns share one, which is the whole point of the memory scene: the second
 * answer comes back family-aware without being told again.
 *
 * The replies are deliberately unedited, including where the assistant declines
 * to invent — "we don't have a ready-made 7-day whole-country package" is a
 * better demonstration of grounding than a confident answer would be.
 */
export type ProductionReply = {
  /** What was actually sent. */
  question: string;
  /** What production actually answered, verbatim. */
  answer: string;
  /** The conversation production created or continued. */
  conversationId: string;
};

export const SDF_REPLY: ProductionReply = {
  question: "What is the Sustainable Development Fee in Bhutan?",
  answer:
    "Bhutan levies a **daily Sustainable Development Fee (SDF)** on every international visitor.\n" +
    "It’s charged per person, per night, and is separate from hotels, guides, transport, and meals. " +
    "The exact amount can vary by nationality and the dates of your stay, so it’s best to check the " +
    "current figure with us or on the travel team before you book.\n\n" +
    "Would you like to know how the fee might impact the cost of a particular trip you’re considering?",
  conversationId: "cmuo2nujp0000js04512rnauy",
};

export const PLAN_REPLY: ProductionReply = {
  question: "Help me plan my trip to Bhutan. I have about a week.",
  answer:
    "That sounds wonderful! A week gives you a good balance of travel and exploration. Do you already " +
    "have dates in mind, or any particular places or activities you’re keen to experience in Bhutan? " +
    "This will help me suggest the best options for your stay.",
  conversationId: "cmuo2onod0004js04ajlv6ecz",
};

/** The grounded refusal. Asked for a 7-day whole-country cultural tour, the
 * assistant checked the real catalogue and said there isn't one. */
export const GROUNDED_REPLY: ProductionReply = {
  question: "The whole country, please. Show me the package and its day-by-day itinerary.",
  answer:
    "It looks like we don’t have a ready‑made 7‑day “whole‑country” package currently. " +
    "We do have longer itineraries that cover all of Bhutan, or we can put together a custom option for you.\n\n" +
    "Would you like me to show you our 10‑day cultural tour that navigates the key dzongkhags, or would " +
    "you prefer a tailored plan that fits exactly 7 days?",
  conversationId: "cmuo2qj1y000cjs049sm413sz",
};

/** Two turns, one conversationId. The second reply ends "family-friendly
 * itinerary" although that turn never mentions a family. */
export const MEMORY_THREAD: ProductionReply[] = [
  {
    question: "I am travelling with my family - two adults and two children aged 9 and 12.",
    answer:
      "Sounds lovely! To find the best options for you and your family, could you let me know:\n\n" +
      "1. Which part of Bhutan you’d like to visit (or if you’re open to a few suggestions)?\n" +
      "2. When you’re planning to travel and how many days you’d have in total?\n" +
      "3. Anything you’re particularly interested in—culture, trekking, wildlife, festivals, or a mix?\n" +
      "4. Your preferred style: relaxed, packed, luxury, or budget?\n\n" +
      "These details will let me pull up the most suitable packages for your family.",
    conversationId: "cmuo36j4i0003jn0464z9prnz",
  },
  {
    question: "Can you adjust the trip for us?",
    answer:
      "Sure thing! Could you share a bit more about what you’re looking for? For example:\n\n" +
      "- The part of Bhutan you’d like to explore and the dates or season.\n" +
      "- How many days you plan to spend in total.\n" +
      "- Any specific interests (culture, trekking, wildlife, festivals) or accommodation preferences.\n\n" +
      "Once we have that, I can fine‑tune a family‑friendly itinerary for you.",
    conversationId: "cmuo36j4i0003jn0464z9prnz",
  },
];
