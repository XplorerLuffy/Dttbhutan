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

import { DEFAULT_SCHEDULE, serializeSchedule } from "@/lib/officeHours";

/** "hours" is the weekly opening-hours editor; its value is the JSON text of a
 * Schedule (src/lib/officeHours.ts). */
export type FieldType = "text" | "textarea" | "url" | "email" | "tel" | "hours";

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
      {
        key: "company.officeHours",
        label: "Opening hours",
        type: "hours",
        default: serializeSchedule(DEFAULT_SCHEDULE),
        help: "Shown on the Contact page with an \"Open now\" indicator, and given to Google as your business hours. Times are Bhutan time.",
      },
      { key: "company.social.facebook", label: "Facebook page", type: "url", default: "", help: "Paste the page's web address. Shown as an icon in the footer and on the Contact page; left out while blank." },
      { key: "company.social.instagram", label: "Instagram profile", type: "url", default: "" },
      { key: "company.social.tripadvisor", label: "TripAdvisor listing", type: "url", default: "" },
      { key: "company.social.youtube", label: "YouTube channel", type: "url", default: "" },
      { key: "company.social.tiktok", label: "TikTok profile", type: "url", default: "" },
    ],
  },

  {
    id: "home.hero",
    label: "Homepage — hero",
    description: "The headline over the video, and the line beneath the search bar.",
    fields: [
      { key: "home.hero.headline", label: "Headline", type: "text", default: "Discover Bhutan, Your Way" },
      { key: "home.hero.searchButton", label: "Search button label", type: "text", default: "Find My Trip" },
      { key: "home.hero.subtitle", label: "Subtitle (under the headline)", type: "text", default: "Culture, nature and meaningful journeys, thoughtfully arranged." },
      { key: "home.hero.searchPrompt", label: "Search prompt (phones)", type: "text", default: "Find My Perfect Trip", help: "Shown on the collapsed search pill on phone screens, before it is tapped open." },
      { key: "home.hero.customPrefix", label: "Custom-trip line, before the link", type: "text", default: "Prefer something personal?" },
      { key: "home.hero.customLink", label: "Custom-trip link text", type: "text", default: "Let us plan your journey." },
      { key: "home.hero.customLinkHref", label: "Custom-trip link target", type: "text", default: "/custom-tour" },
      { key: "home.hero.customSuffix", label: "Custom-trip line, after the link", type: "text", default: "" },
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
      { key: "home.bestsellers.heading", label: "Best sellers — heading", type: "text", default: "Best Selling Packages" },
      { key: "home.bestsellers.subtitle", label: "Best sellers — subtitle", type: "text", default: "The journeys our travelers book most.", help: "The three most-booked tours are chosen automatically; the section is hidden until a tour has been booked." },
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
    id: "browse",
    label: "Browse pages",
    description:
      "The heading and opening line on each page that lists something. The listings themselves come from your packages, destinations and vendor records — this is only the page's own wording. Leave an intro blank and the page shows just the heading.",
    fields: [
      { key: "packages.heading", label: "Package tours — heading", type: "text", default: "Package Tours" },
      { key: "packages.intro", label: "Package tours — intro", type: "textarea", default: "Ready-made itineraries combining a guide, transport, and accommodation into one trip." },
      { key: "packages.customPrompt", label: "Package tours — custom-trip prompt", type: "text", default: "Want something different?", help: "Followed by the link below. Clear this and the link to drop the whole sentence." },
      { key: "packages.customLink", label: "Package tours — custom-trip link text", type: "text", default: "Request a custom tour" },
      { key: "packages.customSuffix", label: "Package tours — after the link", type: "text", default: "instead." },

      { key: "destinations.heading", label: "Destinations — heading", type: "text", default: "Destinations" },
      { key: "destinations.intro", label: "Destinations — intro", type: "textarea", default: "All 20 dzongkhags (districts) of Bhutan — from the well-trodden west to the far east, visited by only a handful of travelers each year." },

      { key: "guides.heading", label: "Tour guides — heading", type: "text", default: "Tour Guides" },
      { key: "guides.intro", label: "Tour guides — intro", type: "textarea", default: "", help: "Empty by design — the page currently shows only a heading. Write something here and it appears beneath it." },

      { key: "hotels.heading", label: "Hotels & stays — heading", type: "text", default: "Hotels & Stays" },
      { key: "hotels.intro", label: "Hotels & stays — intro", type: "textarea", default: "" },

      { key: "vehicles.heading", label: "Transport — heading", type: "text", default: "Transport" },
      { key: "vehicles.intro", label: "Transport — intro", type: "textarea", default: "" },

      { key: "flights.heading", label: "Flights — heading", type: "text", default: "Flights" },
      { key: "flights.intro", label: "Flights — intro", type: "textarea", default: "Bhutan-specific routes (Drukair, Bhutan Airlines) are shown first out of/into Paro. This search runs against a demo flight aggregator — see the README for what a production integration needs.", help: "The second sentence is true today: flight results are not live. Rewrite it when a real airline integration replaces the demo one, and not before." },

      { key: "travelGuide.heading", label: "Travel guide — heading", type: "text", default: "Travel Guide" },
      { key: "travelGuide.intro", label: "Travel guide — intro", type: "textarea", default: "Practical answers to the questions travelers ask us most — visas, fees, timing, and what to expect on the ground in Bhutan." },

      { key: "customTour.heading", label: "Custom tour — heading", type: "text", default: "Build a Custom Tour" },
      { key: "customTour.intro", label: "Custom tour — intro", type: "textarea", default: "Want something more tailored than our package tours? Pick your destinations, dates, and — if you already know what you want — your guide, hotel or homestay, and vehicle. We'll show you the price per person right away; our team still reviews every request before it's confirmed." },
    ],
  },

  {
    id: "about",
    label: "About page",
    description:
      "Everything written on /about. The company facts lower down that page (licence number, registration, address) come from Company details instead, so they can't say two different things in two places.",
    fields: [
      { key: "about.intro", label: "Opening line, under the company name", type: "textarea", default: "A Bhutan-based tour operator arranging guides, accommodation, transport and complete itineraries for travellers visiting the kingdom.", help: "The heading above it is \"About\" followed by your trading name, so it always matches Company details." },
      { key: "about.eyebrow", label: "Small label above the company name", type: "text", default: "About us", help: "Clear it to hide the label." },
      { key: "about.hero.primaryLabel", label: "Top banner — first button (links to Tours)", type: "text", default: "Explore our tours", help: "Clear it to hide the button." },
      { key: "about.hero.secondaryLabel", label: "Top banner — second button (links to Contact)", type: "text", default: "Talk to our team", help: "Clear it to hide the button." },

      { key: "about.whatWeDo.heading", label: "\"What we do\" — heading", type: "text", default: "What we do" },
      { key: "about.whatWeDo.1.title", label: "Card 1 — title", type: "text", default: "Licensed guides" },
      { key: "about.whatWeDo.1.body", label: "Card 1 — text", type: "textarea", default: "Every guide on the platform holds a Tourism Council of Bhutan licence, which we verify before their profile goes live." },
      { key: "about.whatWeDo.2.title", label: "Card 2 — title", type: "text", default: "Hotels & homestays" },
      { key: "about.whatWeDo.2.body", label: "Card 2 — text", type: "textarea", default: "Accommodation across all 20 dzongkhags, from town hotels to village homestays, with real room availability rather than enquiry-only listings." },
      { key: "about.whatWeDo.3.title", label: "Card 3 — title", type: "text", default: "Transport with GPS" },
      { key: "about.whatWeDo.3.body", label: "Card 3 — text", type: "textarea", default: "Vehicles come with licensed drivers, and trips are GPS-tracked so mileage on your invoice matches the distance actually driven." },
      { key: "about.whatWeDo.4.title", label: "Card 4 — title", type: "text", default: "Custom itineraries" },
      { key: "about.whatWeDo.4.body", label: "Card 4 — text", type: "textarea", default: "Pick your own guide, accommodation and vehicle and see the price per person update as you go — or tell us what you want and we'll build it." },

      { key: "about.travelling.heading", label: "\"Travelling in Bhutan\" — heading", type: "text", default: "Travelling in Bhutan" },
      { key: "about.travelling.body", label: "\"Travelling in Bhutan\" — text", type: "textarea", default: "Bhutan manages tourism differently from most destinations. Most international visitors need a visa arranged in advance through a licensed local operator, pay a daily Sustainable Development Fee that funds free healthcare, education and conservation, and travel with a licensed guide.\n\nThat means you can't simply book a flight and arrive — the arrangements have to go through an operator like us. We handle the visa application, the SDF, and the ground arrangements, and itemise each of them separately so you can see exactly what you're paying for.\n\nFees and entry rules are set by the government and change from time to time. We confirm the current figures for your nationality and travel dates as part of your quote rather than quoting a number here that may go out of date.", help: "Leave a blank line between paragraphs. Deliberately quotes no SDF figure — the last paragraph explains why, so read it before adding one." },
      { key: "about.travelling.linkText", label: "\"Travelling in Bhutan\" — link text", type: "text", default: "Read our travel guide →", help: "Links to /travel-guide. Clear it to hide the link." },

      { key: "about.companyDetails.heading", label: "\"Company details\" — heading", type: "text", default: "Company details" },
      { key: "about.cta.text", label: "Closing prompt above the buttons", type: "text", default: "Planning a trip, or want to ask something first?" },
      { key: "about.cta.contactLabel", label: "Closing — first button", type: "text", default: "Contact us" },
      { key: "about.cta.customLabel", label: "Closing — second button", type: "text", default: "Build a custom tour" },
    ],
  },

  {
    id: "contact",
    label: "Contact page",
    description:
      "The wording on /contact. The phone number, email, address and office hours in the sidebar come from Company details — change them there.",
    fields: [
      { key: "contact.heading", label: "Heading", type: "text", default: "Contact us" },
      { key: "contact.intro", label: "Intro", type: "textarea", default: "Ask us anything about visiting Bhutan — you don't need an account. We usually reply within one working day.", help: "It promises a reply time. Only say one you can keep." },
      { key: "contact.eyebrow", label: "Small label above the heading", type: "text", default: "Contact", help: "Clear it to hide the label." },
      { key: "contact.form.heading", label: "Form — heading", type: "text", default: "Send us a message" },
      { key: "contact.hours.heading", label: "Sidebar — opening hours heading", type: "text", default: "Opening hours" },
      { key: "contact.social.heading", label: "Sidebar — social media heading", type: "text", default: "Follow us" },

      { key: "contact.direct.heading", label: "Sidebar — contact details heading", type: "text", default: "Get in touch directly" },

      { key: "contact.elsewhere.heading", label: "Sidebar — \"elsewhere\" heading", type: "text", default: "Looking for something else?" },
      { key: "contact.elsewhere.faqLabel", label: "Link 1 — text", type: "text", default: "Frequently asked questions" },
      { key: "contact.elsewhere.faqBody", label: "Link 1 — description", type: "textarea", default: "Visas, fees, seasons and how booking works." },
      { key: "contact.elsewhere.customLabel", label: "Link 2 — text", type: "text", default: "Build a custom tour" },
      { key: "contact.elsewhere.customBody", label: "Link 2 — description", type: "textarea", default: "Pick your guide, rooms and vehicle and see the price as you go." },
      { key: "contact.elsewhere.registerLabel", label: "Link 3 — text", type: "text", default: "List your business" },
      { key: "contact.elsewhere.registerBody", label: "Link 3 — description", type: "textarea", default: "Guides, hotels and transport operators can apply to join." },
    ],
  },

  {
    id: "faq",
    label: "FAQ page",
    description:
      "The wording around the questions on /faq. The questions and answers themselves are edited under Page content.",
    fields: [
      { key: "faq.eyebrow", label: "Small label above the heading", type: "text", default: "Help centre", help: "Clear it to hide the label." },
      { key: "faq.heading", label: "Heading", type: "text", default: "Frequently asked questions" },
      { key: "faq.intro", label: "Intro", type: "textarea", default: "The things travellers ask us most — visas, fees, guides, booking and payment." },
      { key: "faq.ask.label", label: "Banner button (links to Contact)", type: "text", default: "Ask us a question", help: "Clear it to hide the button." },
      { key: "faq.cta.text", label: "Closing prompt", type: "text", default: "Still have a question? We usually reply within one working day." },
      { key: "faq.cta.button", label: "Closing button (links to Contact)", type: "text", default: "Contact us", help: "Clear it to hide the button." },
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

      { key: "assistant.hero.eyebrow", label: "Hero — small line above", type: "text", default: "Your AI travel assistant" },
      { key: "assistant.hero.headline", label: "Hero — headline", type: "text", default: "Discover Bhutan with DRUKA" },
      { key: "assistant.hero.subtitle", label: "Hero — sub-line", type: "textarea", default: "Ask anything — from travel plans to local tips.\nI'm here to help you create the perfect journey." },
      { key: "assistant.hero.imageUrl", label: "Hero — background image", type: "text", default: "/media/packages/dzong-ridge.webp" },

      { key: "assistant.intro", label: "Who the assistant is", type: "textarea", default: "I'm DRUKA — your Bhutan travel assistant. Ask me anything about itineraries, destinations, permits, local culture, guides, and more." },
      { key: "assistant.greeting", label: "Opening message", type: "textarea", default: "Kuzuzangpo la! I'm DRUKA. Tell me what kind of trip you have in mind — how long you have, what you'd like to see, how much walking you enjoy — and I'll suggest something. Or pick one of the suggested questions." },
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
