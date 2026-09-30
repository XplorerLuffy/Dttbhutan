/**
 * Every editable piece of site copy, in one list.
 *
 * This registry is the single source of truth for three things at once: the
 * admin form (rendered from it, so a new field needs no UI work), the
 * fallback value when nothing has been saved (so a missing row renders the
 * designed copy rather than a blank), and the whitelist of keys the API
 * will accept (so a crafted request can't write arbitrary rows).
 *
 * Defaults are the copy that shipped with the design. Editing a field in
 * admin stores an override; clearing it falls back here again.
 */

export type FieldType = "text" | "textarea" | "url" | "email" | "tel";

export type ContentField = {
  key: string;
  label: string;
  type: FieldType;
  default: string;
  /** Shown under the input — use it for anything non-obvious about where
   * the value appears or what format it needs. */
  help?: string;
};

export type ContentGroup = {
  id: string;
  label: string;
  description?: string;
  fields: ContentField[];
};

export const CONTENT_GROUPS: ContentGroup[] = [
  {
    id: "company",
    label: "Company details",
    description:
      "Real-world facts about the business. These appear in the footer, the About and Contact pages, legal pages, emails, and the structured data search engines read. Leave a field blank and the site hides it rather than printing a placeholder.",
    fields: [
      { key: "company.name", label: "Trading name", type: "text", default: "Droelma Tours & Travels" },
      { key: "company.legalName", label: "Registered legal name", type: "text", default: "", help: "Only if it differs from the trading name." },
      { key: "company.tcbLicenceNumber", label: "TCB licence number", type: "text", default: "", help: "Tourism Council of Bhutan operator licence. Shown as a trust signal — leave blank rather than guessing." },
      { key: "company.registrationNumber", label: "Company registration number", type: "text", default: "" },
      { key: "company.foundedYear", label: "Year founded", type: "text", default: "", help: "Used for \"since YYYY\" copy." },
      { key: "company.address.street", label: "Street address", type: "text", default: "" },
      { key: "company.address.city", label: "City", type: "text", default: "Thimphu" },
      { key: "company.address.country", label: "Country", type: "text", default: "Bhutan" },
      { key: "company.phone", label: "Phone", type: "tel", default: "" },
      { key: "company.whatsapp", label: "WhatsApp number", type: "tel", default: "" },
      { key: "company.email", label: "Public enquiries email", type: "email", default: "" },
      { key: "company.officeHours", label: "Office hours", type: "text", default: "Monday – Friday, 9:00 – 17:00 (BST, UTC+6)" },
      { key: "company.social.facebook", label: "Facebook URL", type: "url", default: "" },
      { key: "company.social.instagram", label: "Instagram URL", type: "url", default: "" },
      { key: "company.social.tripadvisor", label: "TripAdvisor URL", type: "url", default: "" },
    ],
  },

  {
    id: "home.hero",
    label: "Homepage — hero",
    description: "The headline over the video, and the line beneath the search bar.",
    fields: [
      { key: "home.hero.headline", label: "Headline", type: "text", default: "Discover Bhutan, Your Way" },
      { key: "home.hero.searchButton", label: "Search button label", type: "text", default: "See All Trips" },
      { key: "home.hero.searchPrompt", label: "Search prompt (phones)", type: "text", default: "Find My Perfect Trip", help: "Shown on the collapsed search pill on phone screens, before it is tapped open." },
      { key: "home.hero.customPrefix", label: "Custom-trip line, before the link", type: "text", default: "Or" },
      { key: "home.hero.customLink", label: "Custom-trip link text", type: "text", default: "have us build a custom trip" },
      { key: "home.hero.customLinkHref", label: "Custom-trip link target", type: "text", default: "/custom-tour" },
      { key: "home.hero.customSuffix", label: "Custom-trip line, after the link", type: "text", default: "around what you want to see." },
      { key: "home.hero.videoUrl", label: "Background video URL", type: "text", default: "/media/hero.mp4", help: "Attached only once the page is idle, and skipped entirely on reduced-motion or metered connections — so the poster below has to stand on its own. Leave blank to show the poster only." },
      { key: "home.hero.posterUrl", label: "Poster image URL", type: "text", default: "/media/hero-poster.jpg", help: "What every visitor sees first. Use a still from the video so there is no jump when it starts." },
    ],
  },

  {
    id: "home.valueband",
    label: "Homepage — why book with us",
    description: "The tinted band under the hero. The numbers beneath it are counted from the database and are not editable — that is deliberate, so they can't drift from reality.",
    fields: [
      { key: "home.valueband.heading", label: "Heading", type: "text", default: "Bhutan, Arranged Properly" },
      { key: "home.valueband.subheading", label: "Sub-heading", type: "textarea", default: "Bhutan asks every visitor to travel with a licensed guide and a planned itinerary. We handle that part so the trip still feels like yours." },
      { key: "home.valueband.linkLabel", label: "Link label", type: "text", default: "About Droelma" },
      { key: "home.valueband.pillar1.eyebrow", label: "Pillar 1 — small line", type: "text", default: "Your trip" },
      { key: "home.valueband.pillar1.title", label: "Pillar 1 — big line", type: "text", default: "Your way" },
      { key: "home.valueband.pillar1.body", label: "Pillar 1 — text", type: "textarea", default: "Take a ready-made journey as it stands, or tell us what you want to see and we'll shape the itinerary around your interests, dates and pace." },
      { key: "home.valueband.pillar2.eyebrow", label: "Pillar 2 — small line", type: "text", default: "Licensed" },
      { key: "home.valueband.pillar2.title", label: "Pillar 2 — big line", type: "text", default: "Local guides" },
      { key: "home.valueband.pillar2.body", label: "Pillar 2 — text", type: "textarea", default: "Every guide listed carries a Tourism Council of Bhutan licence number and is reviewed by our team before they can accept a single booking." },
      { key: "home.valueband.pillar3.eyebrow", label: "Pillar 3 — small line", type: "text", default: "Grounded in" },
      { key: "home.valueband.pillar3.title", label: "Pillar 3 — big line", type: "text", default: "Bhutan itself" },
      { key: "home.valueband.pillar3.body", label: "Pillar 3 — text", type: "textarea", default: "Routes are built on local knowledge of the dzongkhags — which festivals fall when, which trails open in which season, and what is worth your time." },
      { key: "home.valueband.pillar4.eyebrow", label: "Pillar 4 — small line", type: "text", default: "Book" },
      { key: "home.valueband.pillar4.title", label: "Pillar 4 — big line", type: "text", default: "Directly" },
      { key: "home.valueband.pillar4.body", label: "Pillar 4 — text", type: "textarea", default: "Reserve packages, guides and transport straight through Droelma, with real availability and a confirmation you can hold us to." },
    ],
  },

  {
    id: "home.sections",
    label: "Homepage — section headings",
    description: "The heading and supporting line above each block of cards.",
    fields: [
      { key: "home.packages.heading", label: "Featured tours — heading", type: "text", default: "Journeys Worth the Flight" },
      { key: "home.packages.subtitle", label: "Featured tours — sub-line", type: "textarea", default: "Planned end to end, priced per person, and ready to book — or to use as the starting point for something of your own." },
      { key: "home.packages.cta", label: "Featured tours — button", type: "text", default: "See all tour packages" },
      { key: "home.guides.heading", label: "Guides — heading", type: "text", default: "The People You'll Travel With" },
      { key: "home.guides.subtitle", label: "Guides — sub-line", type: "textarea", default: "Bhutan requires every visitor to travel with a licensed guide. These are ours." },
      { key: "home.guides.cta", label: "Guides — link", type: "text", default: "Meet all our guides →" },
      { key: "home.treks.heading", label: "Trekking — heading", type: "text", default: "Take the Long Way" },
      { key: "home.treks.subtitle", label: "Trekking — sub-line", type: "textarea", default: "Multi-day treks through the high valleys, with guide, crew and gear arranged." },
      { key: "home.destinations.heading", label: "Destinations — heading", type: "text", default: "Twenty Dzongkhags, One Country" },
      { key: "home.destinations.subtitle", label: "Destinations — sub-line", type: "textarea", default: "From the well-trodden west to the far east, visited by only a handful of travelers each year." },
      { key: "home.destinations.cta", label: "Destinations — link", type: "text", default: "Explore every destination →" },
      { key: "home.testimonials.heading", label: "Reviews — heading", type: "text", default: "Our Travelers Say It Best" },
      { key: "home.testimonials.subtitle", label: "Reviews — sub-line", type: "textarea", default: "Every review here is tied to a completed booking — we can't write them, and neither can anyone else." },
      { key: "home.articles.heading", label: "Travel guide — heading", type: "text", default: "Before You Go" },
      { key: "home.articles.subtitle", label: "Travel guide — sub-line", type: "textarea", default: "Visas, the Sustainable Development Fee, and when the weather is actually on your side." },
      { key: "home.articles.cta", label: "Travel guide — link", type: "text", default: "Read the travel guide →" },
    ],
  },

  {
    id: "home.collections",
    label: "Homepage — featured collections",
    description:
      "The scrolling row of collection cards. Each one links to that category of tour. The trip count and the \"from\" price on each card are counted from the database, not typed here, and a collection with no published tours is hidden automatically.",
    fields: [
      { key: "home.collections.heading", label: "Heading", type: "text", default: "Featured Collections" },
      { key: "home.collections.subtitle", label: "Sub-line", type: "textarea", default: "Four ways into Bhutan, depending on what you came for." },
      { key: "home.collections.CULTURAL.title", label: "Cultural — title", type: "text", default: "Dzongs & Festivals" },
      { key: "home.collections.CULTURAL.subtitle", label: "Cultural — sub-line", type: "text", default: "Monasteries, masked dances, market towns" },
      { key: "home.collections.TREKKING.title", label: "Trekking — title", type: "text", default: "Into the High Valleys" },
      { key: "home.collections.TREKKING.subtitle", label: "Trekking — sub-line", type: "text", default: "Multi-day routes with guide, crew and gear" },
      { key: "home.collections.WILDLIFE.title", label: "Wildlife — title", type: "text", default: "Black-Necked Cranes & Forests" },
      { key: "home.collections.WILDLIFE.subtitle", label: "Wildlife — sub-line", type: "text", default: "Phobjikha, Royal Manas and the deep south" },
      { key: "home.collections.HONEYMOON.title", label: "Honeymoon — title", type: "text", default: "Just the Two of You" },
      { key: "home.collections.HONEYMOON.subtitle", label: "Honeymoon — sub-line", type: "text", default: "Quiet valleys, slow mornings, no itinerary to keep up with" },
    ],
  },
  {
    id: "home.responsible",
    label: "Homepage — responsible travel",
    description: "The split panel. The left-hand panel states a fact about Bhutan; keep it to something verifiable.",
    fields: [
      { key: "home.responsible.eyebrow", label: "Panel — small line", type: "text", default: "Carbon negative" },
      { key: "home.responsible.stat", label: "Panel — large statement", type: "textarea", default: "Bhutan absorbs more carbon than it emits — the only country in the world that does." },
      { key: "home.responsible.caption", label: "Panel — caption", type: "textarea", default: "Its constitution requires at least 60% of the country to stay under forest cover, in perpetuity." },
      { key: "home.responsible.heading", label: "Heading", type: "text", default: "High Value, Low Volume" },
      { key: "home.responsible.body1", label: "First paragraph", type: "textarea", default: "Bhutan has never chased visitor numbers. Instead, every traveler pays a Sustainable Development Fee, which goes towards free healthcare and education for Bhutanese citizens, conservation work, and training for people working in tourism." },
      { key: "home.responsible.body2", label: "Second paragraph", type: "textarea", default: "It is the reason the valleys you came to see still look the way they do — and the reason trips here are planned rather than improvised." },
      { key: "home.responsible.cta", label: "Button label", type: "text", default: "How the fee works" },
      { key: "home.responsible.ctaHref", label: "Button link", type: "text", default: "/travel-guide/bhutans-sustainable-development-fee-explained" },
    ],
  },

  {
    id: "home.banner",
    label: "Homepage — closing banner",
    description: "The full-width band over the video, near the bottom of the page.",
    fields: [
      { key: "home.banner.heading", label: "Heading", type: "text", default: "No Two Trips Should Look Alike" },
      { key: "home.banner.subtitle", label: "Sub-line", type: "textarea", default: "Tell us how long you have, what you want to see, and how hard you want to walk. We'll build the rest around it." },
      { key: "home.banner.cta", label: "Button label", type: "text", default: "Plan My Trip" },
      { key: "home.banner.ctaHref", label: "Button link", type: "text", default: "/custom-tour" },
    ],
  },

  {
    id: "home.planner",
    label: "Homepage — planner prompt",
    description:
      "The tinted box at the very bottom of the homepage, for visitors who did not find a package that fits.",
    fields: [
      { key: "home.planner.heading", label: "Heading", type: "text", default: "Not sure where to start?" },
      { key: "home.planner.body", label: "Body", type: "textarea", default: "Tell us what kind of Bhutan experience you're looking for — trekking, culture, festivals, or a slower pace — and we'll help shape a trip around it." },
      { key: "home.planner.cta", label: "Button label", type: "text", default: "Plan with DRUKA" },
      { key: "home.planner.ctaHref", label: "Button link", type: "text", default: "/assistant" },
    ],
  },

  {
    id: "gallery",
    label: "Gallery page",
    description:
      "The photos themselves come from the destinations, packages, hotels and guides — this is just the page's own wording.",
    fields: [
      { key: "gallery.heading", label: "Heading", type: "text", default: "Gallery" },
      { key: "gallery.intro", label: "Intro line", type: "textarea", default: "Destinations, tour packages, stays, and guides from across Bhutan." },
    ],
  },

  {
    id: "assistant",
    label: "AI assistant (DRUKA)",
    description:
      "The assistant's own page at /assistant. The capability cards and the popular questions are not decoration — each one is sent as a message when tapped, so they are how a visitor who doesn't know what to ask gets started. Rewrite them to match the enquiries you actually want.",
    fields: [
      { key: "assistant.name", label: "Assistant name", type: "text", default: "DRUKA" },
      { key: "assistant.role", label: "Assistant role", type: "text", default: "Your AI Travel Assistant" },
      { key: "assistant.brandName", label: "Name on the side rail", type: "text", default: "", help: "Leave blank to use the trading name from Company details." },
      { key: "assistant.brandTagline", label: "Tagline under it", type: "text", default: "Explore · Experience · Belong" },
      { key: "assistant.railFooter", label: "Side rail footer line", type: "textarea", default: "Bhutan awaits,\nlet's plan it together." },

      { key: "assistant.hero.eyebrow", label: "Hero — small line above", type: "text", default: "Your AI travel assistant" },
      { key: "assistant.hero.headline", label: "Hero — headline", type: "text", default: "Discover Bhutan with DRUKA" },
      { key: "assistant.hero.subtitle", label: "Hero — sub-line", type: "textarea", default: "Ask anything — from travel plans to local tips.\nI'm here to help you create the perfect journey." },
      { key: "assistant.hero.imageUrl", label: "Hero — background image", type: "text", default: "/media/packages/dzong-ridge.webp" },

      { key: "assistant.intro", label: "Who the assistant is", type: "textarea", default: "I'm DRUKA — your Bhutan travel assistant. Ask me anything about itineraries, destinations, permits, local culture, guides, and more." },
      { key: "assistant.greeting", label: "Opening message", type: "textarea", default: "Kuzuzangpo la! I'm DRUKA. Tell me what kind of trip you have in mind — how long you have, what you'd like to see, how much walking you enjoy — and I'll suggest something. Or pick one of the questions on the right." },
      { key: "assistant.quote", label: "Gold quote box", type: "textarea", default: "Real advice. Local insight.\nYour journey, made easier." },
      { key: "assistant.placeholder", label: "Message box placeholder", type: "text", default: "Ask me anything — e.g. \"Plan a 7-day trip\" or \"What are the visa requirements?\"" },

      { key: "assistant.action1.title", label: "Card 1 — title", type: "text", default: "Plan itineraries" },
      { key: "assistant.action1.subtitle", label: "Card 1 — sub-line", type: "text", default: "Custom trips for your interests" },
      { key: "assistant.action1.prompt", label: "Card 1 — question it sends", type: "textarea", default: "Help me plan a trip to Bhutan. What itineraries do you offer?" },

      { key: "assistant.action2.title", label: "Card 2 — title", type: "text", default: "Get travel information" },
      { key: "assistant.action2.subtitle", label: "Card 2 — sub-line", type: "text", default: "Visa, permits, weather, culture" },
      { key: "assistant.action2.prompt", label: "Card 2 — question it sends", type: "textarea", default: "What do I need to know before travelling to Bhutan — visas, permits and the daily fee?" },

      { key: "assistant.action3.title", label: "Card 3 — title", type: "text", default: "Find tour guides" },
      { key: "assistant.action3.subtitle", label: "Card 3 — sub-line", type: "text", default: "Verified local guides" },
      { key: "assistant.action3.prompt", label: "Card 3 — question it sends", type: "textarea", default: "Which licensed guides do you work with, and what languages do they speak?" },

      { key: "assistant.action4.title", label: "Card 4 — title", type: "text", default: "Make bookings" },
      { key: "assistant.action4.subtitle", label: "Card 4 — sub-line", type: "text", default: "Tours, experiences, activities" },
      { key: "assistant.action4.prompt", label: "Card 4 — question it sends", type: "textarea", default: "How do I book a trip with you, and what happens after I enquire?" },

      { key: "assistant.questions", label: "Popular questions", type: "textarea", default: "Best time to visit Bhutan\nVisa & entry requirements\nHiking in Bhutan\nCultural etiquette\nTop places to visit", help: "One per line. Each is sent as a message when tapped." },

      { key: "assistant.closing.imageUrl", label: "Closing image", type: "text", default: "/media/packages/alpine-camp.webp", help: "Leave blank to hide the card at the foot of the right rail." },
      { key: "assistant.closing.line", label: "Closing image caption", type: "textarea", default: "More than a trip,\nit's a journey within." },
    ],
  },

  {
    id: "footer",
    label: "Footer",
    fields: [
      { key: "footer.tagline", label: "Tagline", type: "textarea", default: "Guides, hotels, transport and flights — arranged directly with a licensed Bhutanese operator." },
      { key: "footer.copyrightNote", label: "Extra line under the copyright", type: "text", default: "" },
    ],
  },

  {
    id: "legal",
    label: "Legal & cancellation",
    description:
      "Shown on the Terms, Privacy and Cancellation pages. Refund tiers are drafted from common Bhutan operator practice — confirm them against how the business actually operates before launch, and have the pages reviewed by someone qualified.",
    fields: [
      { key: "legal.lastUpdated", label: "Last updated", type: "text", default: "17 September 2026", help: "Printed at the top of each legal page. Update it whenever the wording changes." },
      { key: "legal.tier1.window", label: "Tier 1 — when", type: "text", default: "More than 45 days before departure" },
      { key: "legal.tier1.refund", label: "Tier 1 — refund", type: "text", default: "90% of the trip cost" },
      { key: "legal.tier2.window", label: "Tier 2 — when", type: "text", default: "30–45 days before departure" },
      { key: "legal.tier2.refund", label: "Tier 2 — refund", type: "text", default: "75% of the trip cost" },
      { key: "legal.tier3.window", label: "Tier 3 — when", type: "text", default: "15–29 days before departure" },
      { key: "legal.tier3.refund", label: "Tier 3 — refund", type: "text", default: "50% of the trip cost" },
      { key: "legal.tier4.window", label: "Tier 4 — when", type: "text", default: "7–14 days before departure" },
      { key: "legal.tier4.refund", label: "Tier 4 — refund", type: "text", default: "25% of the trip cost" },
      { key: "legal.tier5.window", label: "Tier 5 — when", type: "text", default: "Less than 7 days before departure, or no-show" },
      { key: "legal.tier5.refund", label: "Tier 5 — refund", type: "text", default: "No refund" },
    ],
  },
];

/** Flat key → default, built once from the registry. */
export const CONTENT_DEFAULTS: Record<string, string> = Object.fromEntries(
  CONTENT_GROUPS.flatMap((g) => g.fields.map((f) => [f.key, f.default]))
);

/** Keys the content API is willing to write. Anything else is rejected. */
export const CONTENT_KEYS = new Set(Object.keys(CONTENT_DEFAULTS));
