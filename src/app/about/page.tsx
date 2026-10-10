import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { LogoLockup } from "@/components/Logo";
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

  const details = [
    { label: "Trading name", value: company.name, plain: true },
    { label: "Registered name", value: company.legalName },
    { label: "TCB licence", value: company.tcbLicenceNumber },
    { label: "Registration no.", value: company.registrationNumber },
    { label: "Operating since", value: company.foundedYear },
  ];

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
        <div className="mx-auto flex max-w-4xl flex-col items-center px-4 py-16 text-center sm:px-6 sm:py-24">
          {content("about.eyebrow") && (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-gold-300">
              {content("about.eyebrow")}
            </p>
          )}
          <h1 className="text-balance font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
            {company.name}
          </h1>
          {content("about.intro") && (
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/90 sm:text-lg">
              {content("about.intro")}
            </p>
          )}
          <div className="mt-7 flex flex-wrap justify-center gap-3">
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

      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        {cards.length > 0 && (
          <section className="pt-14 sm:pt-16">
            <SectionHeading title={content("about.whatWeDo.heading")} />
            <div className="mt-8 grid gap-5 sm:grid-cols-2">
              {cards.map((item, i) => (
                <div
                  key={item.title}
                  className="group rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold-100 font-display text-lg font-semibold text-gold-700">
                    {i + 1}
                  </span>
                  <p className="mt-4 font-display text-lg font-semibold text-stone-900">
                    {item.title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    {item.body}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {(travelling.length > 0 || content("about.travelling.linkText")) && (
          <section className="mt-14 rounded-3xl bg-[#fcf6e9] px-6 py-10 sm:mt-16 sm:px-12 sm:py-12">
            <SectionHeading title={content("about.travelling.heading")} />
            <div className="mx-auto mt-6 max-w-3xl space-y-4 text-[15px] leading-relaxed text-stone-700">
              {travelling.map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
            {content("about.travelling.linkText") && (
              <p className="mt-6 text-center">
                <Link
                  href="/travel-guide"
                  className="inline-block rounded-full bg-brand-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-800"
                >
                  {content("about.travelling.linkText")}
                </Link>
              </p>
            )}
          </section>
        )}

        <section className="mt-14 sm:mt-16">
          <SectionHeading title={content("about.companyDetails.heading")} />
          <dl className="mx-auto mt-8 max-w-2xl divide-y divide-stone-100 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm">
            {details.map(({ label, value, plain }) =>
              !plain &&
              !value.trim() &&
              process.env.NODE_ENV === "production" ? null : (
                <div
                  key={label}
                  className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-baseline sm:gap-6"
                >
                  <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wider text-stone-500">
                    {label}
                  </dt>
                  <dd className="mt-1 text-stone-900">
                    {plain ? value : <CompanyFact value={value} />}
                  </dd>
                </div>
              ),
            )}
            {address && (
              <div className="flex flex-col gap-1 px-6 py-4 sm:flex-row sm:items-baseline sm:gap-6">
                <dt className="w-40 shrink-0 text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Address
                </dt>
                <dd className="mt-1 text-stone-900">{address}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="mt-14 overflow-hidden rounded-3xl bg-brand-900 px-6 py-12 text-center sm:mt-16 sm:px-12">
          <LogoLockup className="mx-auto mb-5 h-auto w-40 brightness-0 invert" />
          {content("about.cta.text") && (
            <p className="mx-auto max-w-xl font-display text-xl text-white sm:text-2xl">
              {content("about.cta.text")}
            </p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {content("about.cta.contactLabel") && (
              <Link
                href="/contact"
                className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-brand-900 hover:bg-stone-100"
              >
                {content("about.cta.contactLabel")}
              </Link>
            )}
            {content("about.cta.customLabel") && (
              <Link
                href="/custom-tour"
                className="rounded-full border border-white/70 px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/10"
              >
                {content("about.cta.customLabel")}
              </Link>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="text-center">
      <h2 className="font-display text-2xl font-semibold text-stone-900 sm:text-3xl">
        {title}
      </h2>
      <span
        aria-hidden
        className="mx-auto mt-3 block h-0.5 w-12 rounded bg-gold-500"
      />
    </div>
  );
}
