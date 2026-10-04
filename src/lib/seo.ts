import { formatAddress, type CompanyDetails } from "@/lib/content";
import { openingHoursJsonLd } from "@/lib/officeHours";

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

/** The site-wide share image (app/opengraph-image.png). A page that sets its
 * own `openGraph` replaces the inherited one wholesale — image included — so
 * pages without a photo of their own name this as the fallback. */
export const DEFAULT_OG_IMAGE = "/opengraph-image.png";

/** The name people actually type: the logo leads with "DTT", and the
 * domain is dttbhutan.com. Declaring these as alternate names is how a search
 * for "DTT Bhutan" is understood to mean this business. */
export const BRAND_ALTERNATE_NAMES = ["DTT", "DTT Bhutan", "Droelma Tours and Travels"];

export const SITE_DESCRIPTION =
  "Droelma Tours & Travels (DTT) is a licensed Bhutan tour operator offering tour packages, treks, festival tours and custom trips, with local guides, hotels and transport arranged for you.";

/** Stable identifiers, so the page-level schemas below can point at the one
 * organisation and website instead of describing them again on every page. */
const organizationId = () => `${siteUrl()}/#organization`;
const websiteId = () => `${siteUrl()}/#website`;

/**
 * schema.org markup describing the business.
 *
 * Only emits fields that hold real values — an unset field is omitted
 * rather than published, because structured data asserting a fake licence
 * number or address to search engines is worse than saying nothing. Values
 * come from /chim/content → Company details.
 */
export function organizationJsonLd(company: CompanyDetails) {
  const { street, city, country } = company.address;
  const sameAs = Object.values(company.social).filter((url) => /^https?:\/\//.test(url));

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": organizationId(),
    name: company.name,
    alternateName: BRAND_ALTERNATE_NAMES,
    url: siteUrl(),
    logo: absoluteUrl("/logo/dtt-logo.png"),
    image: absoluteUrl("/logo/dtt-logo.png"),
    description: SITE_DESCRIPTION,
    ...(company.legalName ? { legalName: company.legalName } : {}),
    ...(company.foundedYear ? { foundingDate: company.foundedYear } : {}),
    ...(company.phone ? { telephone: company.phone } : {}),
    ...(company.email ? { email: company.email } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(company.officeSchedule
      ? { openingHoursSpecification: openingHoursJsonLd(company.officeSchedule) }
      : {}),
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

/** The site itself. Google reads its name and alternate names when deciding
 * what to print as the site name above a search result. */
export function websiteJsonLd(company: CompanyDetails) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(),
    name: company.name,
    alternateName: BRAND_ALTERNATE_NAMES,
    url: siteUrl(),
    inLanguage: "en",
    publisher: { "@id": organizationId() },
  };
}

/** The trail above a result in search ("dttbhutan.com › Packages › …"). The
 * home page is always the first crumb, so callers pass only what follows. */
export function breadcrumbJsonLd(trail: { name: string; path: string }[]) {
  const items = [{ name: "Home", path: "/" }, ...trail];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

/** Image URLs in structured data must be absolute; uploads already are, while
 * anything served from /public is a path. */
function absoluteImage(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return /^https?:\/\//.test(url) ? url : absoluteUrl(url);
}

export function touristTripJsonLd(trip: {
  slug: string;
  title: string;
  summary: string;
  durationDays: number;
  pricePerPersonBTN: number;
  coverPhotoUrl: string | null;
  days: { dayNumber: number; title: string; destination: string | null }[];
  rating?: { average: number; count: number } | null;
}) {
  const url = absoluteUrl(`/packages/${trip.slug}`);
  const image = absoluteImage(trip.coverPhotoUrl);

  return {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    "@id": `${url}#trip`,
    name: trip.title,
    description: trip.summary,
    url,
    ...(image ? { image } : {}),
    touristType: "Leisure travellers",
    // ISO 8601: a 5-day trip is P5D.
    duration: `P${trip.durationDays}D`,
    provider: { "@id": organizationId() },
    itinerary: {
      "@type": "ItemList",
      numberOfItems: trip.days.length,
      itemListElement: trip.days.map((day) => ({
        "@type": "ListItem",
        position: day.dayNumber,
        item: {
          "@type": "TouristAttraction",
          name: day.destination
            ? `Day ${day.dayNumber}: ${day.title} (${day.destination})`
            : `Day ${day.dayNumber}: ${day.title}`,
        },
      })),
    },
    offers: {
      "@type": "Offer",
      price: trip.pricePerPersonBTN,
      priceCurrency: "BTN",
      availability: "https://schema.org/InStock",
      url,
      seller: { "@id": organizationId() },
    },
    // Only when travellers have actually rated it — an invented or empty
    // rating is exactly what search engines penalise.
    ...(trip.rating && trip.rating.count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(trip.rating.average.toFixed(1)),
            reviewCount: trip.rating.count,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };
}

export function touristDestinationJsonLd(place: {
  slug: string;
  name: string;
  description: string | null;
  photoUrl: string | null;
  highlights: string[];
  latitude: number | null;
  longitude: number | null;
}) {
  const url = absoluteUrl(`/destinations/${place.slug}`);
  const image = absoluteImage(place.photoUrl);

  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    "@id": `${url}#place`,
    name: `${place.name}, Bhutan`,
    url,
    ...(place.description ? { description: place.description } : {}),
    ...(image ? { image } : {}),
    ...(place.latitude !== null && place.longitude !== null
      ? { geo: { "@type": "GeoCoordinates", latitude: place.latitude, longitude: place.longitude } }
      : {}),
    containedInPlace: { "@type": "Country", name: "Bhutan" },
    ...(place.highlights.length > 0
      ? {
          includesAttraction: place.highlights.map((name) => ({
            "@type": "TouristAttraction",
            name,
          })),
        }
      : {}),
  };
}

export function articleJsonLd(article: {
  slug: string;
  title: string;
  excerpt: string;
  coverPhotoUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  const url = absoluteUrl(`/travel-guide/${article.slug}`);
  const image = absoluteImage(article.coverPhotoUrl);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline: article.title,
    description: article.excerpt,
    url,
    mainEntityOfPage: url,
    ...(image ? { image } : {}),
    datePublished: article.createdAt.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { "@id": organizationId() },
    publisher: { "@id": organizationId() },
  };
}

/** The editable sections' light markup (see RichText) flattened to the plain
 * text an answer in structured data should be. */
function plainText(body: string): string {
  return body
    .replace(/^\s*\{\{[^}]+\}\}\s*$/gm, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/==(.+?)==/g, "$1")
    .replace(/^\s*-\s+/gm, "• ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function faqJsonLd(items: { heading: string; body: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items
      .filter((item) => item.heading.trim() && item.body.trim())
      .map((item) => ({
        "@type": "Question",
        name: item.heading,
        acceptedAnswer: { "@type": "Answer", text: plainText(item.body) },
      })),
  };
}
