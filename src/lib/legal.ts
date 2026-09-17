/**
 * Flip LEGAL_REVIEWED to true once a qualified legal professional has
 * reviewed the Terms, Privacy and Cancellation pages and their figures
 * have been confirmed against how the business actually operates. Until
 * then those pages show a "draft" banner and highlight every value that
 * still needs confirming.
 */
export const LEGAL_REVIEWED = false;

export const LEGAL_LAST_UPDATED = "17 September 2026";

/**
 * Cancellation tiers, expressed as the refund a traveler receives when
 * cancelling within each window before departure. These are drafted from
 * common Bhutan tour-operator practice — confirm them before launch.
 */
export const CANCELLATION_TIERS = [
  { window: "More than 45 days before departure", refund: "90% of the trip cost" },
  { window: "30–45 days before departure", refund: "75% of the trip cost" },
  { window: "15–29 days before departure", refund: "50% of the trip cost" },
  { window: "7–14 days before departure", refund: "25% of the trip cost" },
  { window: "Less than 7 days before departure, or no-show", refund: "No refund" },
] as const;
