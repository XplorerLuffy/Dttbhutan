import type { Metadata } from "next";
import Link from "next/link";
import ContactForm from "./ContactForm";
import CompanyFact from "@/components/company/CompanyFact";
import OpeningHours from "@/components/company/OpeningHours";
import SocialLinks from "@/components/company/SocialLinks";
import { getSiteContent, companyFrom, formatAddress } from "@/lib/content";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with Droelma Tours & Travels about a trip to Bhutan — no account needed. We usually reply within one working day.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage({
  searchParams,
}: {
  searchParams: Promise<{ subject?: string; departure?: string; message?: string }>;
}) {
  const content = await getSiteContent();
  const company = companyFrom(content);
  const address = formatAddress(company);
  const { subject, departure, message } = await searchParams;
  const contactDetails = [
    { label: "Phone", value: company.phone },
    { label: "WhatsApp", value: company.whatsapp },
    { label: "Email", value: company.email },
  ].filter((d) => d.value.trim() || process.env.NODE_ENV !== "production");

  // Each link's destination is fixed — these are real pages, not editable
  // URLs — but its wording is not. Clearing the label removes the whole entry,
  // which is how an admin hides "List your business" once they stop recruiting
  // vendors, rather than being stuck with a link they don't want.
  const elsewhere = [
    { href: "/faq", label: content("contact.elsewhere.faqLabel"), body: content("contact.elsewhere.faqBody") },
    { href: "/custom-tour", label: content("contact.elsewhere.customLabel"), body: content("contact.elsewhere.customBody") },
    { href: "/register", label: content("contact.elsewhere.registerLabel"), body: content("contact.elsewhere.registerBody") },
  ].filter((item) => item.label.trim());

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="mb-1 font-display text-3xl font-bold text-stone-900">
        {content("contact.heading")}
      </h1>
      {content("contact.intro") && (
        <p className="mb-8 text-stone-600">{content("contact.intro")}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <ContactForm defaultSubject={subject} defaultMessage={message} departureId={departure} />

        <aside className="space-y-4">
          <div className="card">
            <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
              {content("contact.direct.heading")}
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
              {address && (
                <div>
                  <dt className="text-stone-500">Office</dt>
                  <dd className="text-stone-900">{address}</dd>
                </div>
              )}
              {!company.officeSchedule && company.officeHours && (
                <div>
                  <dt className="text-stone-500">Hours</dt>
                  <dd className="text-stone-900">{company.officeHours}</dd>
                </div>
              )}
            </dl>
          </div>

          {company.officeSchedule && (
            <div className="card">
              <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
                Opening hours
              </h2>
              <OpeningHours schedule={company.officeSchedule} />
            </div>
          )}

          {Object.values(company.social).some(Boolean) && (
            <div className="card">
              <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">Follow us</h2>
              <SocialLinks social={company.social} variant="labelled" />
            </div>
          )}

          {elsewhere.length > 0 && (
            <div className="card">
              <h2 className="mb-2 font-display text-lg font-semibold text-stone-900">
                {content("contact.elsewhere.heading")}
              </h2>
              <ul className="space-y-2 text-sm">
                {elsewhere.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-brand-700 hover:underline">
                      {item.label}
                    </Link>
                    {item.body && <p className="text-stone-600">{item.body}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
