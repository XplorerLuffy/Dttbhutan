import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";
import CompanyFact from "@/components/company/CompanyFact";
import { COMPANY, formattedAddress, isPlaceholder } from "@/lib/company";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with Droelma Tours & Travels about a trip to Bhutan — no account needed. We usually reply within one working day.",
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string }>;
}) {
  const { subject } = await searchParams;
  const contactDetails = [
    { label: "Phone", value: COMPANY.phone },
    { label: "WhatsApp", value: COMPANY.whatsapp },
    { label: "Email", value: COMPANY.email },
  ].filter((d) => !isPlaceholder(d.value) || process.env.NODE_ENV !== "production");

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 font-display text-3xl font-bold text-stone-900">Contact us</h1>
      <p className="mb-8 text-stone-600">
        Ask us anything about visiting Bhutan — you don&apos;t need an account. We usually
        reply within one working day.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ContactForm defaultSubject={subject} />

        <aside className="space-y-4">
          <div className="card">
            <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
              Get in touch directly
            </h2>
            <dl className="space-y-2 text-sm">
              {contactDetails.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-stone-500">{label}</dt>
                  <dd className="text-stone-900">
                    <CompanyFact value={value} />
                  </dd>
                </div>
              ))}
              {formattedAddress() && (
                <div>
                  <dt className="text-stone-500">Office</dt>
                  <dd className="text-stone-900">{formattedAddress()}</dd>
                </div>
              )}
              <div>
                <dt className="text-stone-500">Hours</dt>
                <dd className="text-stone-900">{COMPANY.officeHours}</dd>
              </div>
            </dl>
          </div>

          <div className="card">
            <h2 className="mb-2 font-display text-lg font-semibold text-stone-900">
              Looking for something else?
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/faq" className="text-brand-700 hover:underline">
                  Frequently asked questions
                </Link>
                <p className="text-stone-600">Visas, fees, seasons and how booking works.</p>
              </li>
              <li>
                <Link href="/custom-tour" className="text-brand-700 hover:underline">
                  Build a custom tour
                </Link>
                <p className="text-stone-600">
                  Pick your guide, rooms and vehicle and see the price as you go.
                </p>
              </li>
              <li>
                <Link href="/register" className="text-brand-700 hover:underline">
                  List your business
                </Link>
                <p className="text-stone-600">
                  Guides, hotels and transport operators can apply to join.
                </p>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
