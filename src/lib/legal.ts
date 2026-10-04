/**
 * Flip LEGAL_REVIEWED to true once a qualified legal professional has
 * reviewed the Terms, Privacy and Cancellation pages and their figures
 * have been confirmed against how the business actually operates. Until
 * then those pages show a "draft" banner and highlight every value that
 * still needs confirming.
 *
 * This stays a code constant rather than moving to /chim/content with the
 * rest of the wording: it records that a human professional signed the
 * pages off, and that is not something an admin should be able to assert
 * by typing into a box.
 */
export const LEGAL_REVIEWED = false;

