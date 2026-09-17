/**
 * Every real-world fact about the business lives here, and only here.
 *
 * The footer, About/Contact pages, legal pages, email signatures and the
 * schema.org markup all read from this file — so filling in the real
 * details is a one-file change rather than a hunt through the codebase.
 *
 * ⚠️ Values marked TODO are placeholders. They are deliberately obvious
 * rather than plausible-looking: a made-up TCB licence number or address
 * on a live tour operator site is a fabricated credential, so these must
 * be replaced with real values before launch. `isPlaceholder()` below lets
 * the UI flag anything still unset instead of printing a fake.
 */

export const PLACEHOLDER = "TODO";

export function isPlaceholder(value: string | null | undefined): boolean {
  return !value || value.startsWith(PLACEHOLDER);
}

export const COMPANY = {
  /** Trading name shown to travelers. */
  name: "Droelma Tours & Travels",

  /** Registered legal entity name, if it differs from the trading name. */
  legalName: `${PLACEHOLDER} — registered company name`,

  /** Tourism Council of Bhutan operator licence number. */
  tcbLicenceNumber: `${PLACEHOLDER} — TCB licence no.`,

  /** Company/business registration number. */
  registrationNumber: `${PLACEHOLDER} — company registration no.`,

  /** Year the company started operating, used for "since YYYY" copy. */
  foundedYear: `${PLACEHOLDER} — year founded`,

  address: {
    street: `${PLACEHOLDER} — street address`,
    city: "Thimphu",
    country: "Bhutan",
  },

  phone: `${PLACEHOLDER} — phone`,
  whatsapp: `${PLACEHOLDER} — WhatsApp number`,
  email: `${PLACEHOLDER} — public enquiries email`,

  /** Office hours shown on the contact page (Bhutan Time, UTC+6). */
  officeHours: "Monday – Friday, 9:00 – 17:00 (BST, UTC+6)",

  social: {
    facebook: null as string | null,
    instagram: null as string | null,
    tripadvisor: null as string | null,
  },

  /**
   * Memberships/accreditations to display as trust signals. Add real ones
   * only — an unearned association badge is worse than no badge.
   */
  memberships: [] as { name: string; url?: string }[],
} as const;

export function formattedAddress(): string {
  const { street, city, country } = COMPANY.address;
  return [street, city, country].filter((part) => !isPlaceholder(part)).join(", ");
}

/**
 * Renders a company fact, or a visible marker when it hasn't been filled
 * in yet — so an unset value reads as obviously missing during review
 * rather than silently shipping as real information.
 */
export function fact(value: string): { value: string; missing: boolean } {
  return isPlaceholder(value) ? { value, missing: true } : { value, missing: false };
}
