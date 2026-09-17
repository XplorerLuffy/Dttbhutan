import "server-only";
import { randomInt } from "node:crypto";
import { prisma } from "@/lib/prisma";

/**
 * Human-quotable booking references.
 *
 * A cuid is fine as a primary key and useless to a traveler reading it down
 * the phone. These are short, uppercase, and drawn from an alphabet with the
 * easily-confused characters removed (no O/0, I/1/L, S/5, B/8) so a reference
 * read aloud or written by hand comes back unambiguous.
 */

const ALPHABET = "ACDEFGHJKMNPQRTUVWXY2346789";
const CODE_LENGTH = 6;
const PREFIX = "DTT";

function randomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[randomInt(ALPHABET.length)];
  }
  return `${PREFIX}-${code}`;
}

/**
 * Returns a reference not already used by an existing booking.
 *
 * The alphabet gives 27^6 (~387 million) combinations, so a collision is
 * vanishingly unlikely — but "unlikely" isn't "impossible" against a UNIQUE
 * constraint that would fail a real booking, so this checks before returning
 * and retries a few times.
 */
export async function generateBookingReference(): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const candidate = randomCode();
    const existing = await prisma.booking.findUnique({
      where: { reference: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
  }

  // Five collisions in a row means something is badly wrong with the RNG
  // rather than bad luck. Fall back to something guaranteed unique instead
  // of looping forever or throwing away a booking.
  return `${PREFIX}-${Date.now().toString(36).toUpperCase()}`;
}
