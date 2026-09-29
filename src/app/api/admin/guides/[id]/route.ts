import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vendorStatusUpdateSchema } from "@/lib/adminVendor";
import { guideAdminDetailsSchema } from "@/lib/validation";
import { notifyVendorStatusChanged } from "@/lib/email/notify";
import { revalidateHomepage } from "@/lib/revalidate";

/**
 * One endpoint, two kinds of edit: the approval controls send `status`, the edit
 * form sends listing details. They're dispatched apart rather than merged into
 * one schema because only the first should email the vendor — a corrected
 * licence number is not an approval decision, and sending "your listing was
 * approved" again for it would be worse than sending nothing.
 */
function isStatusUpdate(body: unknown): boolean {
  return typeof body === "object" && body !== null && "status" in body;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json().catch(() => null);

    if (!isStatusUpdate(body)) {
      const parsed = guideAdminDetailsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const { destinationIds, ...fields } = parsed.data;
      const updated = await prisma.guideProfile.update({
        where: { id },
        // `set` replaces the coverage list, so unticking a dzongkhag actually
        // removes it — a plain connect would only ever add.
        data: { ...fields, destinations: { set: destinationIds.map((did) => ({ id: did })) } },
      });
      revalidateHomepage();
      return NextResponse.json(updated);
    }

    const parsed = vendorStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.guideProfile.update({
      where: { id },
      data: parsed.data,
      include: { user: true },
    });

    await notifyVendorStatusChanged({
      email: updated.user.email,
      listingName: `${updated.user.name}'s guide profile`,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
    });

    revalidateHomepage();
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
