import "server-only";
import { prisma } from "@/lib/prisma";
import { CONTENT_DEFAULTS, CONTENT_KEYS } from "./registry";
import { parseSchedule, summariseSchedule, type Schedule } from "@/lib/officeHours";

export type SiteContent = {
  /** Saved value, or the registry default when nothing is saved. */
  (key: string): string;
  /** Raw map, for passing a whole group to a client component. */
  all: Record<string, string>;
};

/**
 * Loads all editable copy for one render.
 *
 * One query per request rather than one per field — the whole table is a
 * few dozen short rows. Unknown keys in the database are ignored rather
 * than merged: a field removed from the registry should stop appearing on
 * the site immediately, without needing its row deleted.
 *
 * A blank saved value deliberately falls back to the default. That gives
 * "clear the box to restore the original wording" for free, and means an
 * accidentally-emptied field never renders as a gap in the page.
 */
export async function getSiteContent(): Promise<SiteContent> {
  let rows: { key: string; value: string }[] = [];
  try {
    rows = await prisma.siteContent.findMany({ select: { key: true, value: true } });
  } catch (err) {
    // The table can legitimately be absent when code is deployed ahead of
    // its migration. Falling back to defaults renders the designed copy
    // instead of failing every page on the site.
    if ((err as { code?: string })?.code !== "P2021" && (err as { meta?: { code?: string } })?.meta?.code !== "42P01") {
      throw err;
    }
    console.warn("[content] SiteContent table missing — using defaults");
  }

  const map: Record<string, string> = { ...CONTENT_DEFAULTS };
  for (const row of rows) {
    if (CONTENT_KEYS.has(row.key) && row.value.trim()) map[row.key] = row.value;
  }

  const get = ((key: string) => map[key] ?? "") as SiteContent;
  get.all = map;
  return get;
}

/**
 * Company facts in the shape the rest of the app already expects.
 *
 * `isPlaceholder` is gone: a field is either filled in by the client or
 * empty, and callers hide empty ones. That removes the old failure mode
 * where an unset value printed a "TODO — phone" string on a live page.
 */
export type CompanyDetails = {
  name: string;
  legalName: string;
  tcbLicenceNumber: string;
  registrationNumber: string;
  foundedYear: string;
  address: { street: string; city: string; country: string };
  phone: string;
  whatsapp: string;
  email: string;
  /** One line of text for places a table won't fit (the itinerary PDF). */
  officeHours: string;
  /** The weekly schedule, or null if the saved value is older plain text. */
  officeSchedule: Schedule | null;
  social: {
    facebook: string;
    instagram: string;
    tripadvisor: string;
    youtube: string;
    tiktok: string;
  };
};

export function companyFrom(content: SiteContent): CompanyDetails {
  const hoursValue = content("company.officeHours");
  const officeSchedule = parseSchedule(hoursValue);
  return {
    name: content("company.name"),
    legalName: content("company.legalName"),
    tcbLicenceNumber: content("company.tcbLicenceNumber"),
    registrationNumber: content("company.registrationNumber"),
    foundedYear: content("company.foundedYear"),
    address: {
      street: content("company.address.street"),
      city: content("company.address.city"),
      country: content("company.address.country"),
    },
    phone: content("company.phone"),
    whatsapp: content("company.whatsapp"),
    email: content("company.email"),
    // Hours saved as free text before the weekly editor existed still show.
    officeHours: officeSchedule ? summariseSchedule(officeSchedule) : hoursValue,
    officeSchedule,
    social: {
      facebook: webAddress(content("company.social.facebook")),
      instagram: webAddress(content("company.social.instagram")),
      tripadvisor: webAddress(content("company.social.tripadvisor")),
      youtube: webAddress(content("company.social.youtube")),
      tiktok: webAddress(content("company.social.tiktok")),
    },
  };
}

/**
 * A link target safe to put in an href: an http(s) address, or "" if the
 * value isn't one. A bare "facebook.com/page" gets https:// in front. The
 * admin form checks this too; this is the backstop for anything already
 * saved, since `javascript:` in an href is a script.
 */
export function webAddress(value: string): string {
  const v = value.trim();
  if (!v) return "";
  const withScheme = /^https?:\/\//i.test(v) ? v : /^[\w-]+(\.[\w-]+)+(\/\S*)?$/.test(v) ? `https://${v}` : "";
  try {
    const url = new URL(withScheme);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : "";
  } catch {
    return "";
  }
}

export async function getCompany(): Promise<CompanyDetails> {
  return companyFrom(await getSiteContent());
}

/** Street, city, country — skipping whichever parts aren't filled in. */
export function formatAddress(company: CompanyDetails): string {
  return [company.address.street, company.address.city, company.address.country]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

/**
 * Splits an editable block into paragraphs on blank lines.
 *
 * Any field an admin can write several paragraphs into needs this: a single
 * `whitespace-pre-line` block would run them together with no spacing, and
 * rendering the raw string as HTML would hand whoever can edit content a way
 * to inject markup into every visitor's page. Returning strings keeps the
 * caller mapping them to real elements.
 */
export function paragraphs(text: string): string[] {
  return text
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}
