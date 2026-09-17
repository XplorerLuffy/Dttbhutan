import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Frequently asked questions",
  description:
    "Common questions about visiting Bhutan: visas, the Sustainable Development Fee, guides, booking, payment and cancellations.",
};

/**
 * Deliberately avoids quoting exact SDF and visa fee amounts. Those are set
 * by the government, change from time to time, and vary by nationality —
 * a hardcoded figure here would silently go stale and mislead travelers.
 * The travel-guide articles take the same approach.
 */
const FAQS: { category: string; items: { q: string; a: React.ReactNode }[] }[] = [
  {
    category: "Visiting Bhutan",
    items: [
      {
        q: "Do I need a visa to visit Bhutan?",
        a: (
          <>
            Most international visitors do, and it has to be arranged in advance through a
            licensed Bhutanese tour operator — you can&apos;t get one on arrival independently.
            We handle the application as part of your booking. Visitors from India,
            Bangladesh and the Maldives have different arrangements. See our{" "}
            <Link href="/travel-guide" className="text-brand-700 hover:underline">
              travel guide
            </Link>{" "}
            for the detail.
          </>
        ),
      },
      {
        q: "What is the Sustainable Development Fee?",
        a: (
          <>
            A daily fee every international visitor pays, which funds free healthcare,
            education and conservation in Bhutan. It&apos;s charged per person per night and is
            separate from what you pay for guides, hotels and transport. The rate depends on
            your nationality and travel dates, so we confirm the current figure in your quote
            and itemise it separately rather than burying it in a total.
          </>
        ),
      },
      {
        q: "Do I have to travel with a guide?",
        a: "For most of the country, yes — travelling with a licensed guide is part of how Bhutan manages tourism. Every guide on our platform holds a Tourism Council of Bhutan licence, which we verify before their profile goes live.",
      },
      {
        q: "When is the best time to visit?",
        a: "Spring (March–May) and autumn (September–November) have the most reliable weather, the clearest mountain views, and most of the major tshechu festivals. Winter is quieter and cold at altitude but often very clear. Summer brings the monsoon, heavier in the west than the centre and east.",
      },
      {
        q: "How do I get to Bhutan?",
        a: "Paro is the only international airport, with flights from a handful of regional hubs. There are also land border crossings at Phuentsholing, Gelephu and Samdrup Jongkhar. We can search and book flights alongside your ground arrangements.",
      },
    ],
  },
  {
    category: "Booking with us",
    items: [
      {
        q: "How do I book?",
        a: (
          <>
            Three ways: book a ready-made{" "}
            <Link href="/packages" className="text-brand-700 hover:underline">
              package tour
            </Link>
            , build your own trip with our{" "}
            <Link href="/custom-tour" className="text-brand-700 hover:underline">
              custom tour builder
            </Link>{" "}
            by picking a guide, accommodation and vehicle, or{" "}
            <Link href="/contact" className="text-brand-700 hover:underline">
              contact us
            </Link>{" "}
            and we&apos;ll put something together for you.
          </>
        ),
      },
      {
        q: "Can I book individual guides, hotels or vehicles separately?",
        a: "Yes. You can book a guide, a room, or a vehicle on its own rather than taking a full package — each listing shows real availability and books directly.",
      },
      {
        q: "Is my booking confirmed straight away?",
        a: "Guide, hotel and vehicle bookings start as pending while the provider confirms, and you'll get an email as soon as they do. Package tours need us to assign the guide, rooms and transport before confirming. Flights are ticketed at the time of booking.",
      },
      {
        q: "What currency are prices in?",
        a: "Prices are set in Bhutanese Ngultrum (Nu.), which is pegged 1:1 to the Indian Rupee. You can switch the display to USD, EUR, GBP, AUD or INR using the selector in the header — that's a display conversion at current rates, and billing is in Ngultrum.",
      },
      {
        q: "How do I pay?",
        a: "Payment arrangements are confirmed with you directly as part of your quote. Get in touch and we'll walk you through the options for your booking.",
      },
    ],
  },
  {
    category: "Changes & cancellations",
    items: [
      {
        q: "Can I cancel or change my booking?",
        a: (
          <>
            Yes — how much is refundable depends on how close to departure you cancel. See our{" "}
            <Link href="/cancellation" className="text-brand-700 hover:underline">
              cancellation &amp; refund policy
            </Link>{" "}
            for the full terms, or contact us to discuss changing dates instead of cancelling.
          </>
        ),
      },
      {
        q: "What if the weather disrupts my trip?",
        a: "Mountain weather can affect flights and high-altitude routes. We'll work with you to rearrange affected days where we can. Travel insurance covering trip disruption is strongly recommended.",
      },
      {
        q: "Do I need travel insurance?",
        a: "We strongly recommend it, covering medical treatment, evacuation (particularly for trekking), and trip cancellation. Bhutan's terrain and remoteness make evacuation cover especially worth having.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-display text-3xl font-bold text-stone-900">
        Frequently asked questions
      </h1>
      <p className="mb-8 text-stone-600">
        The things travellers ask us most. If your question isn&apos;t here,{" "}
        <Link href="/contact" className="text-brand-700 hover:underline">
          just ask us
        </Link>
        .
      </p>

      {FAQS.map((section) => (
        <section key={section.category} className="mb-8">
          <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">
            {section.category}
          </h2>
          <div className="space-y-2">
            {section.items.map((item) => (
              <details key={item.q} className="card group">
                <summary className="cursor-pointer list-none font-medium text-stone-900 marker:hidden">
                  <span className="flex items-start justify-between gap-3">
                    {item.q}
                    <span className="mt-0.5 shrink-0 text-stone-400 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </span>
                </summary>
                <div className="mt-3 text-sm leading-relaxed text-stone-700">{item.a}</div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <div className="card text-center">
        <p className="text-sm text-stone-600">
          Still have a question? We usually reply within one working day.
        </p>
        <Link href="/contact" className="btn-primary mt-3 inline-block">
          Contact {COMPANY.name}
        </Link>
      </div>
    </div>
  );
}
