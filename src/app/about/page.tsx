import type { Metadata } from "next";
import Link from "next/link";
import LogoMark from "@/components/Logo";
import CompanyFact from "@/components/company/CompanyFact";
import { COMPANY, formattedAddress, isPlaceholder } from "@/lib/company";

export const metadata: Metadata = {
  title: "About us",
  description:
    "Droelma Tours & Travels is a Bhutan-based tour operator arranging licensed guides, hotels, transport and custom itineraries across all 20 dzongkhags.",
};

const WHAT_WE_DO = [
  {
    title: "Licensed guides",
    body: "Every guide on the platform holds a Tourism Council of Bhutan licence, which we verify before their profile goes live.",
  },
  {
    title: "Hotels & homestays",
    body: "Accommodation across all 20 dzongkhags, from town hotels to village homestays, with real room availability rather than enquiry-only listings.",
  },
  {
    title: "Transport with GPS",
    body: "Vehicles come with licensed drivers, and trips are GPS-tracked so mileage on your invoice matches the distance actually driven.",
  },
  {
    title: "Custom itineraries",
    body: "Pick your own guide, accommodation and vehicle and see the price per person update as you go — or tell us what you want and we'll build it.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-10 flex flex-col items-center text-center">
        <LogoMark className="mb-4 h-16 w-auto" />
        <h1 className="font-display text-3xl font-bold text-stone-900">About {COMPANY.name}</h1>
        <p className="mt-3 text-stone-600">
          A Bhutan-based tour operator arranging guides, accommodation, transport and
          complete itineraries for travellers visiting the kingdom.
        </p>
      </div>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">What we do</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {WHAT_WE_DO.map((item) => (
            <div key={item.title} className="card">
              <p className="font-medium text-stone-900">{item.title}</p>
              <p className="mt-1 text-sm text-stone-600">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">
          Travelling in Bhutan
        </h2>
        <div className="card space-y-3 text-sm text-stone-700">
          <p>
            Bhutan manages tourism differently from most destinations. Most international
            visitors need a visa arranged in advance through a licensed local operator, pay a
            daily Sustainable Development Fee that funds free healthcare, education and
            conservation, and travel with a licensed guide.
          </p>
          <p>
            That means you can&apos;t simply book a flight and arrive — the arrangements have to
            go through an operator like us. We handle the visa application, the SDF, and the
            ground arrangements, and itemise each of them separately so you can see exactly
            what you&apos;re paying for.
          </p>
          <p>
            Fees and entry rules are set by the government and change from time to time. We
            confirm the current figures for your nationality and travel dates as part of your
            quote rather than quoting a number here that may go out of date.
          </p>
          <Link href="/travel-guide" className="inline-block font-medium text-brand-700 hover:underline">
            Read our travel guide →
          </Link>
        </div>
      </section>

      <section className="mb-10">
        <h2 className="mb-3 font-display text-xl font-semibold text-stone-900">
          Company details
        </h2>
        <div className="card">
          <dl className="space-y-2 text-sm">
            <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
              <dt className="w-48 shrink-0 text-stone-500">Trading name</dt>
              <dd className="text-stone-900">{COMPANY.name}</dd>
            </div>
            {[
              { label: "Registered name", value: COMPANY.legalName },
              { label: "TCB licence", value: COMPANY.tcbLicenceNumber },
              { label: "Registration no.", value: COMPANY.registrationNumber },
              { label: "Operating since", value: COMPANY.foundedYear },
            ].map(({ label, value }) =>
              isPlaceholder(value) && process.env.NODE_ENV === "production" ? null : (
                <div key={label} className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                  <dt className="w-48 shrink-0 text-stone-500">{label}</dt>
                  <dd className="text-stone-900">
                    <CompanyFact value={value} />
                  </dd>
                </div>
              )
            )}
            {formattedAddress() && (
              <div className="flex flex-col gap-1 sm:flex-row sm:gap-3">
                <dt className="w-48 shrink-0 text-stone-500">Address</dt>
                <dd className="text-stone-900">{formattedAddress()}</dd>
              </div>
            )}
          </dl>
        </div>
      </section>

      <div className="card flex flex-col items-center gap-3 text-center">
        <p className="text-sm text-stone-600">
          Planning a trip, or want to ask something first?
        </p>
        <div className="flex flex-wrap justify-center gap-2">
          <Link href="/contact" className="btn-primary">
            Contact us
          </Link>
          <Link href="/custom-tour" className="btn-secondary">
            Build a custom tour
          </Link>
        </div>
      </div>
    </div>
  );
}
