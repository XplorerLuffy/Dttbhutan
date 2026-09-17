import { COMPANY, formattedAddress, isPlaceholder } from "@/lib/company";

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
 * Only emits fields that hold real values — an unfilled placeholder is
 * omitted rather than published, because structured data asserting a fake
 * licence number or address to search engines is worse than saying nothing.
 */
export function organizationJsonLd() {
  const { street, city, country } = COMPANY.address;

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: COMPANY.name,
    url: siteUrl(),
    ...(isPlaceholder(COMPANY.legalName) ? {} : { legalName: COMPANY.legalName }),
    ...(isPlaceholder(COMPANY.phone) ? {} : { telephone: COMPANY.phone }),
    ...(isPlaceholder(COMPANY.email) ? {} : { email: COMPANY.email }),
    ...(formattedAddress()
      ? {
          address: {
            "@type": "PostalAddress",
            ...(isPlaceholder(street) ? {} : { streetAddress: street }),
            addressLocality: city,
            addressCountry: country,
          },
        }
      : {}),
    areaServed: { "@type": "Country", name: "Bhutan" },
  };
}
