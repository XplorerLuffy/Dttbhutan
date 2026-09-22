/**
 * Hand-authored knowledge for the first tenant.
 *
 * These are plain-text versions of content that currently only exists as
 * hardcoded JSX on the website (src/app/faq/page.tsx, /cancellation,
 * /terms) — the assistant can't read a React component, so the text has to
 * exist somewhere it can actually be retrieved from.
 *
 * ⚠️ Deliberately written so every factual claim is either (a) generic and
 * verifiable, or (b) an explicit "contact the team to confirm". Nothing
 * here invents a price, a deadline, or a legal term for the agency — that
 * content has to come from the agency itself, and until it does, the
 * assistant correctly says it can't confirm. Replace these entries with the
 * agency's real published policies before relying on them.
 *
 * This file is example/seed content for one tenant, not part of the
 * architecture: another agency's knowledge would be ingested from its own
 * documents, never from this file.
 */

export type KnowledgeSeedEntry = {
  title: string;
  category: string;
  /** PUBLIC is readable by anonymous website visitors. INTERNAL is not
   * reachable through the anonymous chat tool at all — included here so the
   * separation is exercised by real data, not just by tests. */
  visibility: "PUBLIC" | "INTERNAL";
  sourceType: "FAQ" | "POLICY" | "MANUAL";
  /** Stable identifier used to replace (not duplicate) this entry when
   * ingestion re-runs. */
  sourceRef: string;
  content: string;
};

export const KNOWLEDGE_SEED: KnowledgeSeedEntry[] = [
  {
    title: "How booking works with us",
    category: "Booking",
    visibility: "PUBLIC",
    sourceType: "FAQ",
    sourceRef: "faq-how-booking-works",
    content: `There are three ways to arrange a trip with us.

The first is to book a tour package directly from the packages page. Each package lists its own price per person, duration, and a day-by-day plan, along with what is and isn't included.

The second is to build a custom tour. You tell us your dates, how many travelers, which destinations interest you, and — if you already know what you want — your preferred guide, accommodation, and vehicle. You'll see an indicative price as you go, and our team reviews every custom request before anything is confirmed.

The third is to book individual services separately: a licensed guide, a hotel or homestay, or transport with a driver, each from its own listing page.

In all three cases, submitting a request is not the same as a confirmed booking. Our team reviews availability and confirms with you directly. Nothing is charged automatically at the point of enquiry.`,
  },
  {
    title: "Do I need to travel with a guide in Bhutan?",
    category: "Travel requirements",
    visibility: "PUBLIC",
    sourceType: "FAQ",
    sourceRef: "faq-guide-requirement",
    content: `Bhutan's tourism rules require most international visitors to arrange their trip through a licensed tour operator, and to be accompanied by a licensed guide for travel outside the main towns of Thimphu and Paro. Rules differ for visitors from India, Bangladesh, and the Maldives.

Every guide listed on this site holds a Tourism Council of Bhutan licence and is approved by our team before they can take bookings.

Entry rules, visa requirements, and the Sustainable Development Fee are set by the Bhutanese government and change from time to time. We don't publish current figures or requirements here, because an out-of-date number on a travel site can genuinely disrupt someone's trip. Ask our team and we'll confirm exactly what applies to your nationality and travel dates.`,
  },
  {
    title: "Cancellation and changes",
    category: "Policies",
    visibility: "PUBLIC",
    sourceType: "POLICY",
    sourceRef: "policy-cancellation",
    content: `If you need to cancel or change a trip, contact us as early as you can — the further ahead you tell us, the more we can usually do.

Cancellation terms depend on what was booked and how far in advance you cancel. Package tours, individual guide bookings, hotel reservations, and transport each have different arrangements, and some are set by the hotel or operator rather than by us.

We do not publish a single fixed cancellation schedule here, because the terms that actually apply to your booking are the ones confirmed to you in writing when that booking was made. If you're unsure what applies to yours, ask us and we'll confirm the exact terms for your reference number.

Trips can also be disrupted by weather, road closures, or flight changes, which are common in Bhutan's mountain terrain. Where that happens we work with you to reschedule rather than treating it as a cancellation.`,
  },
  {
    title: "Payments and currency",
    category: "Booking",
    visibility: "PUBLIC",
    sourceType: "FAQ",
    sourceRef: "faq-payments-currency",
    content: `Prices on this site are stored and calculated in Bhutanese Ngultrum (BTN). You can switch the display currency using the selector in the site header, which converts using current exchange rates — the converted figure is indicative, and the amount actually charged is the BTN amount.

Payment arrangements are confirmed by our team as part of confirming a booking, not automatically at the point of enquiry. If you've been asked to pay and want to check that a request is genuine, contact us directly through the contact page before sending anything.`,
  },
  {
    title: "Internal — enquiry handling notes",
    category: "Operations",
    visibility: "INTERNAL",
    sourceType: "MANUAL",
    sourceRef: "internal-enquiry-handling",
    content: `Staff reference only. Not for publication to website visitors.

Custom tour requests arrive in the admin dashboard under Custom tour requests, and anonymous enquiries under Enquiries. Both carry a booking reference that should be quoted in every reply so the traveler can match correspondence to their request.

Availability for guides, vehicles, and rooms must be checked against the actual booking records before confirming anything to a traveler — an indicative price shown during a custom tour request is not a held reservation.

Any traveler question about visa status, the Sustainable Development Fee, or entry rules should be answered from the current government guidance at the time of asking, not from previously sent correspondence.`,
  },
];
