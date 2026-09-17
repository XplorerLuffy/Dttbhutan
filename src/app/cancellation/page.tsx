import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell, { Clause, Confirm } from "@/components/legal/LegalPageShell";
import { CANCELLATION_TIERS } from "@/lib/legal";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Cancellation & refund policy",
  description:
    "How cancellations and refunds work for Droelma Tours & Travels bookings, including refund tiers by days before departure.",
};

export default function CancellationPage() {
  return (
    <LegalPageShell
      title="Cancellation & refund policy"
      intro={`How cancellations, changes and refunds work for bookings made with ${COMPANY.name}.`}
    >
      <Clause heading="1. Cancelling a booking">
        <p>
          You can cancel a booking from your dashboard or by contacting us. The refund you
          receive depends on how far before your departure date we receive the cancellation.
          The date we receive written notice is the date used, not the date you decided.
        </p>
        <div className="overflow-x-auto">
          <table className="mt-2 w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 text-left text-stone-500">
                <th className="py-2 pr-4 font-medium">When you cancel</th>
                <th className="py-2 font-medium">Refund</th>
              </tr>
            </thead>
            <tbody>
              {CANCELLATION_TIERS.map((tier) => (
                <tr key={tier.window} className="border-b border-stone-100">
                  <td className="py-2 pr-4">{tier.window}</td>
                  <td className="py-2">
                    <Confirm>{tier.refund}</Confirm>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Clause>

      <Clause heading="2. What isn't refundable">
        <p>
          Some costs are paid to third parties on your behalf and are governed by their rules
          rather than ours:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Visa fees</strong> are generally non-refundable once the application has
            been submitted.
          </li>
          <li>
            <strong>The Sustainable Development Fee</strong> is refundable according to the
            rules set by the Government of Bhutan at the time of cancellation, which we will
            confirm for your booking.
          </li>
          <li>
            <strong>Flight tickets</strong> follow the airline&apos;s own fare rules. Many
            discounted fares are non-refundable.
          </li>
          <li>
            <strong>Bank charges and payment processing fees</strong> already incurred.
          </li>
        </ul>
      </Clause>

      <Clause heading="3. Changing dates instead of cancelling">
        <p>
          Where possible we would rather move your trip than cancel it. If you ask to change
          dates more than <Confirm>30 days</Confirm> before departure we will do our best to
          rebook you with no change fee, subject to availability and any difference in
          seasonal pricing. Closer to departure, a change may be treated as a cancellation and
          rebooking under the tiers above.
        </p>
      </Clause>

      <Clause heading="4. If we cancel">
        <p>
          If we cancel a confirmed booking for any reason within our control, you will receive
          a full refund of everything you have paid us, or the option to rebook at no extra
          cost.
        </p>
        <p>
          If a trip cannot go ahead for reasons outside anyone&apos;s control — weather closing a
          route, flight cancellations, natural events, government restrictions — we will
          rearrange what we can and refund the portion of your payment we are able to recover
          from suppliers. This is why we strongly recommend travel insurance that covers trip
          disruption.
        </p>
      </Clause>

      <Clause heading="5. Trekking and remote itineraries">
        <p>
          Multi-day treks and remote itineraries commit staff, permits and supplies well in
          advance. Cancellations within <Confirm>30 days</Confirm> of departure on these trips
          may be subject to stricter terms than the table above, which we will tell you at the
          time of booking.
        </p>
      </Clause>

      <Clause heading="6. How refunds are paid">
        <p>
          Refunds are made to the original payment method where possible, in Bhutanese
          Ngultrum. If your payment was converted from another currency, the amount you receive
          may differ from what you originally paid due to exchange rate movement and your
          bank&apos;s fees, which are outside our control. We aim to process approved refunds
          within <Confirm>14 working days</Confirm>.
        </p>
      </Clause>

      <Clause heading="7. Getting in touch">
        <p>
          To cancel or change a booking, or to ask about a refund, please{" "}
          <Link href="/contact" className="text-brand-700 hover:underline">
            contact us
          </Link>{" "}
          with your booking reference. Please don&apos;t rely on a cancellation until you have
          received written confirmation from us.
        </p>
      </Clause>
    </LegalPageShell>
  );
}
