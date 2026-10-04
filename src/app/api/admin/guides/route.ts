import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { adminGuideCreateSchema } from "@/lib/validation";
import { VendorAccountConflict, vendorAccountFor } from "@/lib/adminVendor";
import { revalidateHomepage } from "@/lib/revalidate";

/**
 * An admin adds a guide directly — for guides the agency already works with,
 * who shouldn't have to sign up and wait for approval to appear on the site.
 *
 * Creates (or reuses) the guide's account and the profile together, so a
 * failure part-way leaves neither. The listing goes live as APPROVED: the
 * admin adding it is the review. Its status can still be changed from the
 * vendors list like any other.
 */
export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError)
      return NextResponse.json({ error: err.message }, { status: 403 });
    throw err;
  }

  const parsed = adminGuideCreateSchema.safeParse(
    await req.json().catch(() => null),
  );
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { contact, guide } = parsed.data;
  const { destinationIds, ...fields } = guide;

  try {
    const profile = await prisma.$transaction(async (tx) => {
      const userId = await vendorAccountFor(tx, contact, "GUIDE");
      return tx.guideProfile.create({
        data: {
          ...fields,
          userId,
          status: "APPROVED",
          adminNote: "Added by an admin.",
          destinations: { connect: destinationIds.map((id) => ({ id })) },
        },
        select: { id: true },
      });
    });

    revalidateHomepage();
    return NextResponse.json(profile, { status: 201 });
  } catch (err) {
    if (err instanceof VendorAccountConflict) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    throw err;
  }
}
