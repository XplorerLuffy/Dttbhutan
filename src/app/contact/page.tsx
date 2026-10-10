import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
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

  const card = "rounded-2xl border border-stone-200 bg-white p-5 shadow-sm";
  const cardHeading = "mb-3 font-display text-lg font-semibold text-stone-900";

  return (
    <div className="pb-10">
      <section className="relative isolate overflow-hidden bg-brand-950">
        <Image
          src="/media/packages/dzong-ridge.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover opacity-45"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-brand-950/70 via-brand-950/40 to-brand-950/80" />
        <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-14">
          {content("contact.eyebrow") && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
              {content("contact.eyebrow")}
            </p>
          )}
          <h1 className="text-balance font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {content("contact.heading")}
          </h1>
          {content("contact.intro") && (
            <p className="mt-3 text-base leading-relaxed text-white/90 sm:text-[17px]">
              {content("contact.intro")}
            </p>
          )}
        </div>
      </section>

      <div className="mx-auto mt-8 grid max-w-5xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_340px]">
        <div>
          {content("contact.form.heading") && (
            <h2 className="mb-3 font-display text-2xl font-semibold text-stone-900">
              {content("contact.form.heading")}
            </h2>
          )}
          <ContactForm defaultSubject={subject} defaultMessage={message} departureId={departure} />
        </div>

        <aside className="space-y-4 lg:pt-11">
          <div className={card}>
            <h2 className={cardHeading}>{content("contact.direct.heading")}</h2>
            <dl className="space-y-3 text-sm">
              {contactDetails.map(({ label, value }) => (
                <div key={label}>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">{label}</dt>
                  <dd className="mt-0.5 text-stone-900">
                    <CompanyFact value={value} />
                  </dd>
                </div>
              ))}
              {address && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Office</dt>
                  <dd className="mt-0.5 text-stone-900">{address}</dd>
                </div>
              )}
              {!company.officeSchedule && company.officeHours && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wider text-stone-500">Hours</dt>
                  <dd className="mt-0.5 text-stone-900">{company.officeHours}</dd>
                </div>
              )}
            </dl>
          </div>

          {company.officeSchedule && (
            <div className={card}>
              <h2 className={cardHeading}>{content("contact.hours.heading")}</h2>
              <OpeningHours schedule={company.officeSchedule} />
            </div>
          )}

          {Object.values(company.social).some(Boolean) && (
            <div className={card}>
              <h2 className={cardHeading}>{content("contact.social.heading")}</h2>
              <SocialLinks social={company.social} variant="labelled" />
            </div>
          )}

          {elsewhere.length > 0 && (
            <div className="rounded-2xl bg-[#fcf6e9] p-5">
              <h2 className="mb-3 font-display text-lg font-semibold text-stone-900">
                {content("contact.elsewhere.heading")}
              </h2>
              <ul className="space-y-3 text-sm">
                {elsewhere.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="font-semibold text-brand-700 hover:underline">
                      {item.label}
                    </Link>
                    {item.body && <p className="mt-0.5 text-stone-600">{item.body}</p>}
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
