import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import type { vendorContactSchema } from "@/lib/validation";

export const vendorStatusUpdateSchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "PENDING"]),
  adminNote: z.string().max(1000).optional(),
});

/**
 * Every guide profile and hotel belongs to a User — the schema requires it,
 * and the vendor dashboards hang off it. A listing an admin adds directly
 * still needs one, so this finds or creates it.
 *
 * With no email given, the account gets a placeholder address on the
 * reserved `.invalid` domain: unique, obviously not real, and never mailed
 * (see isPlaceholderEmail, checked before any email is sent). Such an
 * account has no password and no Supabase login, so nobody can sign in as
 * it — the agency manages the listing from the admin panel.
 */
const PLACEHOLDER_DOMAIN = "no-login.invalid";

export function isPlaceholderEmail(email: string | null | undefined): boolean {
  return Boolean(email?.toLowerCase().endsWith(`@${PLACEHOLDER_DOMAIN}`));
}

/** A reason the admin should pick a different email — shown as-is. */
export class VendorAccountConflict extends Error {}

const ROLE_LABEL = { GUIDE: "tour guide", HOTEL_OPERATOR: "hotel" } as const;

export async function vendorAccountFor(
  tx: Prisma.TransactionClient,
  contact: z.infer<typeof vendorContactSchema>,
  role: "GUIDE" | "HOTEL_OPERATOR",
): Promise<string> {
  const email = contact.email?.trim().toLowerCase();
  const phone = contact.phone?.trim() || null;

  if (email) {
    const existing = await tx.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        phone: true,
        guideProfile: { select: { id: true } },
        hotel: { select: { id: true } },
      },
    });

    if (existing) {
      // Reuse only an account of the same kind that hasn't listed yet — e.g.
      // a guide who signed up but never finished the form. Anything else
      // would hand someone else's account a listing they didn't create.
      if (existing.role !== role) {
        throw new VendorAccountConflict(
          `${email} already belongs to a different kind of account. Use another email, or leave it blank.`,
        );
      }
      const listed = role === "GUIDE" ? existing.guideProfile : existing.hotel;
      if (listed) {
        throw new VendorAccountConflict(
          `${email} already has a ${ROLE_LABEL[role]} listing — edit that one from the vendors list instead.`,
        );
      }
      if (phone && !existing.phone) {
        await tx.user.update({ where: { id: existing.id }, data: { phone } });
      }
      return existing.id;
    }
  }

  const user = await tx.user.create({
    data: {
      email: email || `listing-${randomUUID()}@${PLACEHOLDER_DOMAIN}`,
      name: contact.name.trim(),
      phone,
      role,
    },
    select: { id: true },
  });
  return user.id;
}
