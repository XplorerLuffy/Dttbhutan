import type { Metadata } from "next";
import Link from "next/link";
import LegalPageShell, { Clause, Confirm } from "@/components/legal/LegalPageShell";
import { COMPANY } from "@/lib/company";

export const metadata: Metadata = {
  title: "Privacy policy",
  description:
    "What personal data Droelma Tours & Travels collects, why, who it's shared with, and the rights you have over it.",
};

export default function PrivacyPage() {
  return (
    <LegalPageShell
      title="Privacy policy"
      intro={`What personal data ${COMPANY.name} collects, why we need it, and what we do with it.`}
    >
      <Clause heading="1. What we collect">
        <p>We collect only what we need to arrange and run your trip:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Account details</strong> — your name, email address, phone number and
            password (stored only as a cryptographic hash, never in readable form).
          </li>
          <li>
            <strong>Booking details</strong> — travel dates, party size, the guides, rooms,
            vehicles or packages you book, and any notes or requirements you send us.
          </li>
          <li>
            <strong>Visa and travel document details</strong> — passport information required
            by the Government of Bhutan to process your visa.
          </li>
          <li>
            <strong>Messages</strong> — enquiries you send, and messages exchanged with
            providers about a booking.
          </li>
          <li>
            <strong>Reviews and photos</strong> you choose to publish.
          </li>
          <li>
            <strong>Vehicle location data</strong> from GPS devices during your trip, used to
            verify trip distance and to power live tracking.
          </li>
        </ul>
      </Clause>

      <Clause heading="2. Why we use it">
        <p>
          To arrange your trip, process your visa, confirm and manage bookings, send you
          booking notifications, verify trip mileage for accurate billing, respond to your
          enquiries, and meet our legal and tax obligations as a licensed operator.
        </p>
        <p>
          We do not sell your personal data, and we do not use it for advertising or
          profiling.
        </p>
      </Clause>

      <Clause heading="3. Who we share it with">
        <p>Only where it&apos;s needed to deliver your trip:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Guides, hotels and transport operators</strong> you have booked — they
            receive the details needed to provide the service, not your full account history.
          </li>
          <li>
            <strong>Government of Bhutan authorities</strong> — for visa processing and the
            Sustainable Development Fee, as required by law.
          </li>
          <li>
            <strong>Airlines and flight booking partners</strong>, where we book flights for
            you.
          </li>
          <li>
            <strong>Service providers that run our systems</strong> — hosting, database and
            email delivery. They process data on our instructions only.
          </li>
        </ul>
      </Clause>

      <Clause heading="4. Where your data is held">
        <p>
          Our systems are hosted with cloud providers whose servers may be located outside
          Bhutan. Where personal data is transferred internationally, we rely on providers who
          apply appropriate safeguards.
        </p>
      </Clause>

      <Clause heading="5. How long we keep it">
        <p>
          Booking and financial records are retained for <Confirm>7 years</Confirm> to meet
          accounting and tax requirements. Account data is kept while your account is open.
          Enquiries that don&apos;t become bookings are kept for{" "}
          <Confirm>24 months</Confirm>. GPS location data is retained for{" "}
          <Confirm>12 months</Confirm> after the trip, for billing verification and dispute
          resolution.
        </p>
      </Clause>

      <Clause heading="6. Your rights">
        <p>
          You can ask us for a copy of the personal data we hold about you, ask us to correct
          anything inaccurate, ask us to delete data we no longer have a legal reason to keep,
          or object to a particular use. Contact us and we will respond within{" "}
          <Confirm>30 days</Confirm>.
        </p>
        <p>
          Note that we may be unable to delete records we are legally required to retain, such
          as booking and tax records, until the retention period has passed.
        </p>
      </Clause>

      <Clause heading="7. Cookies">
        <p>
          We use cookies that are necessary for the site to work — keeping you signed in and
          holding your session securely. Your currency preference is stored locally in your
          own browser and never sent to us. We do not use advertising or third-party tracking
          cookies.
        </p>
      </Clause>

      <Clause heading="8. Security">
        <p>
          Passwords are hashed, sessions are signed, and access to traveller data is restricted
          by role — a guide or hotel sees only the bookings that concern them. No system is
          perfectly secure, but we take reasonable measures to protect your information.
        </p>
      </Clause>

      <Clause heading="9. Children">
        <p>
          Accounts are for adults. Children travel as part of a booking made by an adult, and
          we collect their details only as needed for visas and trip arrangements.
        </p>
      </Clause>

      <Clause heading="10. Contact">
        <p>
          To exercise any of the rights above, or to ask how your data is handled, please{" "}
          <Link href="/contact" className="text-brand-700 hover:underline">
            contact us
          </Link>
          .
        </p>
      </Clause>
    </LegalPageShell>
  );
}
