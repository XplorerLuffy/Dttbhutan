import { formatAddress, type CompanyDetails } from "@/lib/content";

/** Absolute base URL for canonical links, sitemap entries and OG tags. */
export function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://dttbhutan.vercel.app"
  ).replace(/\/$/, "");
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
