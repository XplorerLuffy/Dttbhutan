import "server-only";
import { revalidatePath } from "next/cache";

/**
 * The homepage is the one public page rendered at build time rather than per
 * request (`○ /` in the build output). Everything else public — /packages,
 * /travel-guide, /destinations, /guides and their detail pages — is dynamic
 * and already reflects a database write on the next request.
 *
 * So a write only goes stale where it feeds the homepage: featured packages,
 * trekking, the guide cards, the destination grid, traveler quotes, the
 * article row, and the counted stat strip. Anything that touches those has
 * to say so, or an admin edits a package, sees /packages update, and
 * reasonably concludes the site is fine while the homepage still shows the
 * old one until the next deploy.
 *
 * Kept as a named function rather than a bare revalidatePath call at each
 * site so the reason lives in one place and the call reads as intent.
 */
export function revalidateHomepage(): void {
  revalidatePath("/");
}
