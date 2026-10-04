/**
 * A booking, as the admin sees it.
 *
 * The page itself is shared with travellers and vendors (it decides who may
 * see what from the signed-in account), but the admin's login is separate
 * from the public site's — see authRealm.ts — so the admin opens it from here,
 * under /chim, where their own login applies.
 */
export { default } from "@/app/dashboard/bookings/[id]/page";
