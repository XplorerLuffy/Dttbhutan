import "server-only";
import { prisma } from "@/lib/prisma";
import { CONTENT_DEFAULTS, CONTENT_KEYS } from "./registry";

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
  officeHours: string;
  social: { facebook: string; instagram: string; tripadvisor: string };
};

export function companyFrom(content: SiteContent): CompanyDetails {
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
    officeHours: content("company.officeHours"),
    social: {
      facebook: content("company.social.facebook"),
      instagram: content("company.social.instagram"),
      tripadvisor: content("company.social.tripadvisor"),
    },
  };
}

export async function getCompany(): Promise<CompanyDetails> {
  return companyFrom(await getSiteContent());
}
