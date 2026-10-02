import { formatAddress, type CompanyDetails } from "@/lib/content";

/**
 * The site's public address — used by canonical links, the sitemap, Open
 * Graph tags, the itinerary PDF and every email. The one place it is decided.
 *
 * In order:
 *
 *   1. NEXT_PUBLIC_SITE_URL, if set — an explicit override.
 *   2. VERCEL_PROJECT_PRODUCTION_URL, which Vercel sets to the project's
 *      shortest production domain: dttbhutan.vercel.app until a custom domain
 *      is connected, then dttbhutan.com. So connecting the domain moves every
 *      link over on the next deploy, with nothing to edit. It is the same on
 *      preview deployments, which is right — a preview's canonical links
 *      should point at production, not at itself.
 *   3. dttbhutan.vercel.app, for anywhere that is not Vercel at all.
 *
 * Never VERCEL_URL: that is one particular deployment's address, which
 * changes on every push. The itinerary PDF used it once and printed a link
 * that would have stopped working within the day.
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");

  const production = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (production) return `https://${production.replace(/^https?:\/\//, "")}`.replace(/\/$/, "");

  return "https://dttbhutan.vercel.app";
}

export function absoluteUrl(path: string): string {
  return `${siteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

/**
 * schema.org markup describing the business.
 *
 * Only emits fields that hold real values — an unset field is omitted
 * rather than published, because structured data asserting a fake licence
 * number or address to search engines is worse than saying nothing. Values
 * come from /admin/content → Company details.
 */
export function organizationJsonLd(company: CompanyDetails) {
  const { street, city, country } = company.address;

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: company.name,
    url: siteUrl(),
    ...(company.legalName ? { legalName: company.legalName } : {}),
    ...(company.phone ? { telephone: company.phone } : {}),
    ...(company.email ? { email: company.email } : {}),
    ...(formatAddress(company)
      ? {
          address: {
            "@type": "PostalAddress",
            ...(street ? { streetAddress: street } : {}),
            addressLocality: city,
            addressCountry: country,
          },
        }
      : {}),
    areaServed: { "@type": "Country", name: "Bhutan" },
  };
}
