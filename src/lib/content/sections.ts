import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Long-form page bodies: FAQ entries and legal clauses.
 *
 * These are lists the client adds to and reorders, so unlike SiteContent
 * they can't be a fixed set of registry keys. The text below is what the
 * pages shipped with, transcribed verbatim from the JSX they replaced, so
 * the client edits real copy instead of retyping a legal document.
 *
 * Defaults apply per page, not per row: as soon as a page has any saved
 * sections, those are the page, and the defaults here stop being consulted.
 * Anything else would make "delete a clause" impossible — a deleted row
 * would simply reappear from the defaults on the next render.
 */

export type SectionDraft = {
  /** FAQ category heading. Null on legal pages, which aren't grouped. */
  group: string | null;
  heading: string;
  body: string;
};

export type Section = SectionDraft & { id: string; position: number };

export const SECTION_PAGES = [
  { id: "faq", label: "FAQ", grouped: true },
  { id: "terms", label: "Terms & conditions", grouped: false },
  { id: "privacy", label: "Privacy policy", grouped: false },
  { id: "cancellation", label: "Cancellation & refunds", grouped: false },
] as const;

export type SectionPageId = (typeof SECTION_PAGES)[number]["id"];

export const SECTION_PAGE_IDS = new Set<string>(SECTION_PAGES.map((p) => p.id));

const FAQ_DEFAULTS: SectionDraft[] = [
  {
    group: "Visiting Bhutan",
    heading: "Do I need a visa to visit Bhutan?",
    body: "Most international visitors do, and it has to be arranged in advance through a licensed Bhutanese tour operator — you can't get one on arrival independently. We handle the application as part of your booking. Visitors from India, Bangladesh and the Maldives have different arrangements. See our [travel guide](/travel-guide) for the detail.",
  },
  {
    group: "Visiting Bhutan",
    heading: "What is the Sustainable Development Fee?",
    body: "A daily fee every international visitor pays, which funds free healthcare, education and conservation in Bhutan. It's charged per person per night and is separate from what you pay for guides, hotels and transport. The rate depends on your nationality and travel dates, so we confirm the current figure in your quote and itemise it separately rather than burying it in a total.",
  },
  {
    group: "Visiting Bhutan",
    heading: "Do I have to travel with a guide?",
    body: "For most of the country, yes — travelling with a licensed guide is part of how Bhutan manages tourism. Every guide on our platform holds a Tourism Council of Bhutan licence, which we verify before their profile goes live.",
  },
  {
    group: "Visiting Bhutan",
    heading: "When is the best time to visit?",
    body: "Spring (March–May) and autumn (September–November) have the most reliable weather, the clearest mountain views, and most of the major tshechu festivals. Winter is quieter and cold at altitude but often very clear. Summer brings the monsoon, heavier in the west than the centre and east.",
  },
  {
    group: "Visiting Bhutan",
    heading: "How do I get to Bhutan?",
    body: "Paro is the only international airport, with flights from a handful of regional hubs. There are also land border crossings at Phuentsholing, Gelephu and Samdrup Jongkhar. We can search and book flights alongside your ground arrangements.",
  },
  {
    group: "Booking with us",
    heading: "How do I book?",
    body: "Three ways: book a [tour package](/packages), build your own trip with our [custom tour builder](/custom-tour) by picking a guide, accommodation and vehicle, or [contact us](/contact) and we'll put something together for you.",
  },
  {
    group: "Booking with us",
    heading: "Can I book individual guides, hotels or vehicles separately?",
    body: "Yes. You can book a guide, a room, or a vehicle on its own rather than taking a full package — each listing shows real availability and books directly.",
  },
  {
    group: "Booking with us",
    heading: "Is my booking confirmed straight away?",
    body: "Guide, hotel and vehicle bookings start as pending while the provider confirms, and you'll get an email as soon as they do. Package tours need us to assign the guide, rooms and transport before confirming. Flights are ticketed at the time of booking.",
  },
  {
    group: "Booking with us",
    heading: "What currency are prices in?",
    body: "Prices are set in Bhutanese Ngultrum (Nu.), which is pegged 1:1 to the Indian Rupee. You can switch the display to USD, EUR, GBP, AUD or INR using the selector in the header — that's a display conversion at current rates, and billing is in Ngultrum.",
  },
  {
    group: "Booking with us",
    heading: "How do I pay?",
    body: "Payment arrangements are confirmed with you directly as part of your quote. Get in touch and we'll walk you through the options for your booking.",
  },
  {
    group: "Changes & cancellations",
    heading: "Can I cancel or change my booking?",
    body: "Yes — how much is refundable depends on how close to departure you cancel. See our [cancellation & refund policy](/cancellation) for the full terms, or contact us to discuss changing dates instead of cancelling.",
  },
  {
    group: "Changes & cancellations",
    heading: "What if the weather disrupts my trip?",
    body: "Mountain weather can affect flights and high-altitude routes. We'll work with you to rearrange affected days where we can. Travel insurance covering trip disruption is strongly recommended.",
  },
  {
    group: "Changes & cancellations",
    heading: "Do I need travel insurance?",
    body: "We strongly recommend it, covering medical treatment, evacuation (particularly for trekking), and trip cancellation. Bhutan's terrain and remoteness make evacuation cover especially worth having.",
  },
];

const TERMS_DEFAULTS: SectionDraft[] = [
  {
    group: null,
    heading: "1. Who we are",
    body: "{{company-identity}}\n\nIn these terms, \"we\" and \"us\" means the operator named above, and \"you\" means the person making the booking and everyone travelling on it.",
  },
  {
    group: null,
    heading: "2. Booking and confirmation",
    body: "Submitting a booking through the site is an offer to book, not a confirmed reservation. A booking becomes confirmed only when we confirm it in writing. Guide, accommodation and vehicle bookings begin as pending while the provider confirms availability; package tours are confirmed once we have assigned the guide, accommodation and transport.\n\nThe person making the booking confirms they are at least 18, are authorised to accept these terms on behalf of everyone in the party, and that the details given for each traveller are accurate.",
  },
  {
    group: null,
    heading: "3. Prices and payment",
    body: "Prices are quoted in Bhutanese Ngultrum (Nu.). Other currencies shown on the site are an indicative conversion at recent exchange rates for display only — your booking is priced and billed in Ngultrum, and the amount your bank charges you may differ.\n\nUnless we agree otherwise, a deposit of ==30%== is payable to confirm a booking, with the balance due ==30 days== before departure. Bookings made within that window are payable in full at the time of booking. We may treat a booking as cancelled if the balance is not paid by the due date.\n\nGovernment fees — including the Sustainable Development Fee and visa fees — are set by the Government of Bhutan, itemised separately in your quote, and may change if the government changes them before your travel dates.",
  },
  {
    group: null,
    heading: "4. What's included",
    body: "Your confirmation sets out exactly what is included. Anything not listed is not included — typically international flights to and from Bhutan, travel insurance, personal expenses, tips, and optional activities.",
  },
  {
    group: null,
    heading: "5. Changes and cancellations",
    body: "Cancellations, refunds and date changes are covered by our [cancellation & refund policy](/cancellation), which forms part of these terms.\n\nWe may occasionally need to change an itinerary — substituting accommodation of a similar standard, reordering days, or altering a route for weather or safety. We will tell you as soon as we can and, where a change is significant, offer you the choice of accepting it, taking an alternative, or cancelling for a full refund.",
  },
  {
    group: null,
    heading: "6. Travel documents, insurance and health",
    body: "You are responsible for holding a passport valid for the period required for entry, for giving us accurate details for your visa application, and for meeting any health or vaccination requirements.\n\nTravel insurance is strongly recommended and should cover medical treatment, emergency evacuation — particularly for trekking and high-altitude travel — and trip cancellation. Some trekking itineraries may require proof of adequate cover.\n\nYou must tell us about any medical condition, dietary requirement or mobility need that could affect your trip, so we can tell you honestly whether an itinerary is suitable.",
  },
  {
    group: null,
    heading: "7. Your responsibilities while travelling",
    body: "Bhutan has strong cultural and religious norms, particularly at dzongs, monasteries and during festivals. You agree to follow your guide's instructions on safety and on respecting local customs, and to comply with Bhutanese law.\n\nWe may end a traveller's trip without refund where their behaviour puts others at risk, or is seriously disruptive or unlawful.",
  },
  {
    group: null,
    heading: "8. Vendors on our platform",
    body: "Guides, hotels, homestays and transport operators listed on the site are independently licensed businesses. We verify licences and approve listings before they appear, and we arrange and stand behind the bookings we take. Where a booking is made directly with a listed provider, that provider is responsible for delivering the service they have agreed to.",
  },
  {
    group: null,
    heading: "9. Liability",
    body: "We take reasonable care in selecting and arranging the services that make up your trip. We are not liable for loss or damage caused by events outside our reasonable control, including weather, natural events, flight disruption, illness, or acts of government.\n\nNothing in these terms limits liability for death or personal injury caused by our negligence, or for fraud, or for anything else that cannot be limited under applicable law.",
  },
  {
    group: null,
    heading: "10. GPS tracking",
    body: "Vehicles used on your trip may carry GPS devices. We use the data to verify trip distance for billing and to provide optional live trip tracking. Where you choose to share a tracking link, anyone with that link can see the vehicle's location for the duration of the trip. See our [privacy policy](/privacy) for how this data is handled.",
  },
  {
    group: null,
    heading: "11. Complaints",
    body: "If something goes wrong during your trip, tell your guide or contact us immediately so we have the chance to put it right while you are still in the country. If it isn't resolved, write to us within ==28 days== of returning and we will investigate.",
  },
  {
    group: null,
    heading: "12. Governing law",
    body: "These terms are governed by the laws of the Kingdom of Bhutan, and disputes are subject to the jurisdiction of the Bhutanese courts.",
  },
  {
    group: null,
    heading: "13. Contact",
    body: "Questions about these terms? Please [get in touch](/contact).",
  },
];

const PRIVACY_DEFAULTS: SectionDraft[] = [
  {
    group: null,
    heading: "1. What we collect",
    body: "We collect only what we need to arrange and run your trip:\n\n- **Account details** — your name, email address, phone number and password (stored only as a cryptographic hash, never in readable form).\n- **Booking details** — travel dates, party size, the guides, rooms, vehicles or packages you book, and any notes or requirements you send us.\n- **Visa and travel document details** — passport information required by the Government of Bhutan to process your visa.\n- **Messages** — enquiries you send, and messages exchanged with providers about a booking.\n- **Reviews and photos** you choose to publish.\n- **Vehicle location data** from GPS devices during your trip, used to verify trip distance and to power live tracking.",
  },
  {
    group: null,
    heading: "2. Why we use it",
    body: "To arrange your trip, process your visa, confirm and manage bookings, send you booking notifications, verify trip mileage for accurate billing, respond to your enquiries, and meet our legal and tax obligations as a licensed operator.\n\nWe do not sell your personal data, and we do not use it for advertising or profiling.",
  },
  {
    group: null,
    heading: "3. Who we share it with",
    body: "Only where it's needed to deliver your trip:\n\n- **Guides, hotels and transport operators** you have booked — they receive the details needed to provide the service, not your full account history.\n- **Government of Bhutan authorities** — for visa processing and the Sustainable Development Fee, as required by law.\n- **Airlines and flight booking partners**, where we book flights for you.\n- **Service providers that run our systems** — hosting, database and email delivery. They process data on our instructions only.",
  },
  {
    group: null,
    heading: "4. Where your data is held",
    body: "Our systems are hosted with cloud providers whose servers may be located outside Bhutan. Where personal data is transferred internationally, we rely on providers who apply appropriate safeguards.",
  },
  {
    group: null,
    heading: "5. How long we keep it",
    body: "Booking and financial records are retained for ==7 years== to meet accounting and tax requirements. Account data is kept while your account is open. Enquiries that don't become bookings are kept for ==24 months==. GPS location data is retained for ==12 months== after the trip, for billing verification and dispute resolution.",
  },
  {
    group: null,
    heading: "6. Your rights",
    body: "You can ask us for a copy of the personal data we hold about you, ask us to correct anything inaccurate, ask us to delete data we no longer have a legal reason to keep, or object to a particular use. Contact us and we will respond within ==30 days==.\n\nNote that we may be unable to delete records we are legally required to retain, such as booking and tax records, until the retention period has passed.",
  },
  {
    group: null,
    heading: "7. Cookies",
    body: "We use cookies that are necessary for the site to work — keeping you signed in and holding your session securely. Your currency preference is stored locally in your own browser and never sent to us. We do not use advertising or third-party tracking cookies.",
  },
  {
    group: null,
    heading: "8. Security",
    body: "Passwords are hashed, sessions are signed, and access to traveller data is restricted by role — a guide or hotel sees only the bookings that concern them. No system is perfectly secure, but we take reasonable measures to protect your information.",
  },
  {
    group: null,
    heading: "9. Children",
    body: "Accounts are for adults. Children travel as part of a booking made by an adult, and we collect their details only as needed for visas and trip arrangements.",
  },
  {
    group: null,
    heading: "10. Contact",
    body: "To exercise any of the rights above, or to ask how your data is handled, please [contact us](/contact).",
  },
];

const CANCELLATION_DEFAULTS: SectionDraft[] = [
  {
    group: null,
    heading: "1. Cancelling a booking",
    body: "You can cancel a booking from your dashboard or by contacting us. The refund you receive depends on how far before your departure date we receive the cancellation. The date we receive written notice is the date used, not the date you decided.\n\n{{cancellation-tiers}}",
  },
  {
    group: null,
    heading: "2. What isn't refundable",
    body: "Some costs are paid to third parties on your behalf and are governed by their rules rather than ours:\n\n- **Visa fees** are generally non-refundable once the application has been submitted.\n- **The Sustainable Development Fee** is refundable according to the rules set by the Government of Bhutan at the time of cancellation, which we will confirm for your booking.\n- **Flight tickets** follow the airline's own fare rules. Many discounted fares are non-refundable.\n- **Bank charges and payment processing fees** already incurred.",
  },
  {
    group: null,
    heading: "3. Changing dates instead of cancelling",
    body: "Where possible we would rather move your trip than cancel it. If you ask to change dates more than ==30 days== before departure we will do our best to rebook you with no change fee, subject to availability and any difference in seasonal pricing. Closer to departure, a change may be treated as a cancellation and rebooking under the tiers above.",
  },
  {
    group: null,
    heading: "4. If we cancel",
    body: "If we cancel a confirmed booking for any reason within our control, you will receive a full refund of everything you have paid us, or the option to rebook at no extra cost.\n\nIf a trip cannot go ahead for reasons outside anyone's control — weather closing a route, flight cancellations, natural events, government restrictions — we will rearrange what we can and refund the portion of your payment we are able to recover from suppliers. This is why we strongly recommend travel insurance that covers trip disruption.",
  },
  {
    group: null,
    heading: "5. Trekking and remote itineraries",
    body: "Multi-day treks and remote itineraries commit staff, permits and supplies well in advance. Cancellations within ==30 days== of departure on these trips may be subject to stricter terms than the table above, which we will tell you at the time of booking.",
  },
  {
    group: null,
    heading: "6. How refunds are paid",
    body: "Refunds are made to the original payment method where possible, in Bhutanese Ngultrum. If your payment was converted from another currency, the amount you receive may differ from what you originally paid due to exchange rate movement and your bank's fees, which are outside our control. We aim to process approved refunds within ==14 working days==.",
  },
  {
    group: null,
    heading: "7. Getting in touch",
    body: "To cancel or change a booking, or to ask about a refund, please [contact us](/contact).",
  },
];

const DEFAULTS: Record<SectionPageId, SectionDraft[]> = {
  faq: FAQ_DEFAULTS,
  terms: TERMS_DEFAULTS,
  privacy: PRIVACY_DEFAULTS,
  cancellation: CANCELLATION_DEFAULTS,
};

export function defaultSections(page: SectionPageId): Section[] {
  return DEFAULTS[page].map((s, i) => ({ ...s, id: `default-${page}-${i}`, position: i }));
}

/**
 * The saved sections for a page, or the shipped defaults if it has never
 * been edited. `usingDefaults` lets the admin screen say which it is
 * showing, so "why can't I delete this clause" has a visible answer.
 */
export async function getSections(
  page: SectionPageId
): Promise<{ sections: Section[]; usingDefaults: boolean }> {
  let rows: Section[] = [];
  try {
    rows = await prisma.contentSection.findMany({
      where: { page },
      orderBy: { position: "asc" },
      select: { id: true, group: true, heading: true, body: true, position: true },
    });
  } catch (err) {
    // Code can ship ahead of its migration; falling back to defaults renders
    // the page rather than 500-ing it.
    if ((err as { code?: string })?.code !== "P2021" && (err as { meta?: { code?: string } })?.meta?.code !== "42P01") {
      throw err;
    }
    console.warn("[content] ContentSection table missing — using defaults");
  }

  if (rows.length === 0) return { sections: defaultSections(page), usingDefaults: true };
  return { sections: rows, usingDefaults: false };
}
