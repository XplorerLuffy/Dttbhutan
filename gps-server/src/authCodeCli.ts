/**
 * Prints the authentication code a device must be configured with:
 *   GPS_DEVICE_AUTH_SECRET=... npx tsx src/authCodeCli.ts 012345678901
 * Give the code to the supplier, to enter into the tracker, if it cannot
 * register on its own first (0x0100) and learn the code from the reply.
 */
import { authCodeFor } from "./auth";

const secret = process.env.GPS_DEVICE_AUTH_SECRET;
const phone = process.argv[2];
if (!secret || !phone || !/^\d{12}$/.test(phone)) {
  console.error("usage: GPS_DEVICE_AUTH_SECRET=... tsx src/authCodeCli.ts <12-digit terminal phone number>");
  process.exit(1);
}
console.log(authCodeFor(secret, phone));
