import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import CompanyFact from "@/components/company/CompanyFact";
import {
  getSiteContent,
  companyFrom,
  formatAddress,
  paragraphs,
} from "@/lib/content";

export const metadata: Metadata = {
  title: "About Us — Bhutan Tour Operator",
  description:
    "Droelma Tours & Travels (DTT) is a Bhutan-based tour operator arranging licensed guides, hotels, transport and custom itineraries across all 20 dzongkhags.",
  alternates: { canonical: "/about" },
};

/** The four cards under "What we do". Numbered rather than named so the
 * registry can hold them as flat keys the admin form renders without any
 * per-card work here. */
const CARD_NUMBERS = [1, 2, 3, 4] as const;

export default async function AboutPage() {
  const content = await getSiteContent();
  const company = companyFrom(content);
  const address = formatAddress(company);

  // A card with neither a title nor a body is one the admin emptied, so it
  // disappears rather than leaving a blank box in the grid.
  const cards = CARD_NUMBERS.map((n) => ({
    title: content(`about.whatWeDo.${n}.title`),
    body: content(`about.whatWeDo.${n}.body`),
  })).filter((card) => card.title.trim() || card.body.trim());

  const travelling = paragraphs(content("about.travelling.body"));

  return (
    <div className="pb-10">
      {/* Opening banner */}
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
        <div className="w-full px-4 py-12 text-center sm:px-8 sm:py-16 lg:px-[7%]">
          {content("about.eyebrow") && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
              {content("about.eyebrow")}
            </p>
          )}
          <h1 className="text-balance font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {company.name}
          </h1>
          {content("about.intro") && (
            <p className="mt-5 whitespace-pre-line text-left text-base leading-relaxed text-white/90 sm:text-lg">
              {content("about.intro")}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {content("about.hero.primaryLabel") && (
              <Link
                href="/packages"
                className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-900 hover:bg-stone-100"
              >
                {content("about.hero.primaryLabel")}
              </Link>
            )}
            {content("about.hero.secondaryLabel") && (
              <Link
                href="/contact"
                className="rounded-full border border-white/70 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                {content("about.hero.secondaryLabel")}
              </Link>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 pt-8 sm:px-6">
        {cards.length > 0 && (
          <section className="mb-10">
            <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">
              {content("about.whatWeDo.heading")}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {cards.map((item) => (
                <div key={item.title} className="card">
                  <p className="font-medium text-stone-900">{item.title}</p>
                  <p className="mt-1 text-sm text-stone-600">{item.body}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(travelling.length > 0 || content("about.travelling.linkText")) && (
          <section className="mb-10">
            <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">
              {content("about.travelling.heading")}
            </h2>
            <div className="card space-y-3 text-sm text-stone-700">
              {travelling.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
              {content("about.travelling.linkText") && (
                <Link
                  href="/travel-guide"
                  className="inline-block font-medium text-brand-700 hover:underline"
                >
                  {content("about.travelling.linkText")}
                </Link>
              )}
            </div>
          </section>
        )}

        <section className="mb-10">
          <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">
            {content("about.companyDetails.heading")}
          </h2>
          <div className="card">
            <dl className="space-y-2 text-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <dt className="w-48 shrink-0 text-stone-500">Trading name</dt>
                <dd className="text-stone-900">{company.name}</dd>
              </div>
              {[
                { label: "Registered name", value: company.legalName },
                { label: "TCB licence", value: company.tcbLicenceNumber },
                {
                  label: "Registration no.",
                  value: company.registrationNumber,
                },
                { label: "Operating since", value: company.foundedYear },
              ].map(({ label, value }) =>
                !value.trim() &&
                process.env.NODE_ENV === "production" ? null : (
                  <div
                    key={label}
                    className="flex flex-col gap-1 sm:flex-row sm:gap-3"
                  >
                    <dt className="w-48 shrink-0 text-stone-500">{label}</dt>
                    <dd className="text-stone-900">
                      <CompanyFact value={value} />
                    </dd>
                  </div>
                ),
              )}
              {address && (
                <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                  <dt className="w-48 shrink-0 text-stone-500">Address</dt>
                  <dd className="text-stone-900">{address}</dd>
                </div>
              )}
            </dl>
          </div>
        </section>

        <div className="card flex flex-col items-center gap-3 text-center">
          {content("about.cta.text") && (
            <p className="text-sm text-stone-600">
              {content("about.cta.text")}
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-2">
            {content("about.cta.contactLabel") && (
              <Link href="/contact" className="btn-primary">
                {content("about.cta.contactLabel")}
              </Link>
            )}
            {content("about.cta.customLabel") && (
              <Link href="/custom-tour" className="btn-secondary">
                {content("about.cta.customLabel")}
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
