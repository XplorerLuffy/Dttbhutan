import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell, { Clause, Confirm } from "@/components/legal/LegalPageShell";
import CompanyFact from "@/components/company/CompanyFact";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Terms & conditions",
  description:
    "The terms that apply when you book travel arrangements in Bhutan through Droelma Tours & Travels.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms & conditions"
      intro={`The terms that apply when you book travel arrangements through ${COMPANY.name}.`}
    >
      <Clause heading="1. Who we are">
        <p>
          {COMPANY.name} is a tour operator based in Bhutan, arranging guides, accommodation,
          transport, flights and complete itineraries for visitors.
        </p>
        <p className="space-x-2">
          <CompanyFact label="Registered name" value={COMPANY.legalName} />{" "}
          <CompanyFact label="TCB licence" value={COMPANY.tcbLicenceNumber} />
        </p>
        <p>
          In these terms, &quot;we&quot; and &quot;us&quot; means {COMPANY.name}, and
          &quot;you&quot; means the person making the booking and everyone travelling on it.
        </p>
      </Clause>

      <Clause heading="2. Booking and confirmation">
        <p>
          Submitting a booking through the site is an offer to book, not a confirmed
          reservation. A booking becomes confirmed only when we confirm it in writing. Guide,
          accommodation and vehicle bookings begin as pending while the provider confirms
          availability; package tours are confirmed once we have assigned the guide,
          accommodation and transport.
        </p>
        <p>
          The person making the booking confirms they are at least 18, are authorised to
          accept these terms on behalf of everyone in the party, and that the details given
          for each traveller are accurate.
        </p>
      </Clause>

      <Clause heading="3. Prices and payment">
        <p>
          Prices are quoted in Bhutanese Ngultrum (Nu.). Other currencies shown on the site are
          an indicative conversion at recent exchange rates for display only — your booking is
          priced and billed in Ngultrum, and the amount your bank charges you may differ.
        </p>
        <p>
          Unless we agree otherwise, a deposit of <Confirm>30%</Confirm> is payable to confirm
          a booking, with the balance due <Confirm>30 days</Confirm> before departure. Bookings
          made within that window are payable in full at the time of booking. We may treat a
          booking as cancelled if the balance is not paid by the due date.
        </p>
        <p>
          Government fees — including the Sustainable Development Fee and visa fees — are set
          by the Government of Bhutan, itemised separately in your quote, and may change if
          the government changes them before your travel dates.
        </p>
      </Clause>

      <Clause heading="4. What's included">
        <p>
          Your confirmation sets out exactly what is included. Anything not listed is not
          included — typically international flights to and from Bhutan, travel insurance,
          personal expenses, tips, and optional activities.
        </p>
      </Clause>

      <Clause heading="5. Changes and cancellations">
        <p>
          Cancellations, refunds and date changes are covered by our{" "}
          <Link href="/cancellation" className="text-brand-700 hover:underline">
            cancellation &amp; refund policy
          </Link>
          , which forms part of these terms.
        </p>
        <p>
          We may occasionally need to change an itinerary — substituting accommodation of a
          similar standard, reordering days, or altering a route for weather or safety. We
          will tell you as soon as we can and, where a change is significant, offer you the
          choice of accepting it, taking an alternative, or cancelling for a full refund.
        </p>
      </Clause>

      <Clause heading="6. Travel documents, insurance and health">
        <p>
          You are responsible for holding a passport valid for the period required for entry,
          for giving us accurate details for your visa application, and for meeting any health
          or vaccination requirements.
        </p>
        <p>
          Travel insurance is strongly recommended and should cover medical treatment,
          emergency evacuation — particularly for trekking and high-altitude travel — and trip
          cancellation. Some trekking itineraries may require proof of adequate cover.
        </p>
        <p>
          You must tell us about any medical condition, dietary requirement or mobility need
          that could affect your trip, so we can tell you honestly whether an itinerary is
          suitable.
        </p>
      </Clause>

      <Clause heading="7. Your responsibilities while travelling">
        <p>
          Bhutan has strong cultural and religious norms, particularly at dzongs, monasteries
          and during festivals. You agree to follow your guide&apos;s instructions on safety and
          on respecting local customs, and to comply with Bhutanese law.
        </p>
        <p>
          We may end a traveller&apos;s trip without refund where their behaviour puts others at
          risk, or is seriously disruptive or unlawful.
        </p>
      </Clause>

      <Clause heading="8. Vendors on our platform">
        <p>
          Guides, hotels, homestays and transport operators listed on the site are independently
          licensed businesses. We verify licences and approve listings before they appear, and
          we arrange and stand behind the bookings we take. Where a booking is made directly
          with a listed provider, that provider is responsible for delivering the service they
          have agreed to.
        </p>
      </Clause>

      <Clause heading="9. Liability">
        <p>
          We take reasonable care in selecting and arranging the services that make up your
          trip. We are not liable for loss or damage caused by events outside our reasonable
          control, including weather, natural events, flight disruption, illness, or acts of
          government.
        </p>
        <p>
          Nothing in these terms limits liability for death or personal injury caused by our
          negligence, or for fraud, or for anything else that cannot be limited under
          applicable law.
        </p>
      </Clause>

      <Clause heading="10. GPS tracking">
        <p>
          Vehicles used on your trip may carry GPS devices. We use the data to verify trip
          distance for billing and to provide optional live trip tracking. Where you choose to
          share a tracking link, anyone with that link can see the vehicle&apos;s location for
          the duration of the trip. See our{" "}
          <Link href="/privacy" className="text-brand-700 hover:underline">
            privacy policy
          </Link>{" "}
          for how this data is handled.
        </p>
      </Clause>

      <Clause heading="11. Complaints">
        <p>
          If something goes wrong during your trip, tell your guide or contact us immediately
          so we have the chance to put it right while you are still in the country. If it
          isn&apos;t resolved, write to us within <Confirm>28 days</Confirm> of returning and we
          will investigate.
        </p>
      </Clause>

      <Clause heading="12. Governing law">
        <p>
          These terms are governed by the laws of the Kingdom of Bhutan, and disputes are
          subject to the jurisdiction of the Bhutanese courts.
        </p>
      </Clause>

      <Clause heading="13. Contact">
        <p>
          Questions about these terms? Please{" "}
          <Link href="/contact" className="text-brand-700 hover:underline">
            get in touch
          </Link>
          .
        </p>
      </Clause>
    </LegalPageShell>
  );
}
