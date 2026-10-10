import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";
import { prisma } from "@/lib/prisma";
import { vendorStatusUpdateSchema } from "@/lib/adminVendor";
import { hotelAdminDetailsSchema } from "@/lib/validation";
import { notifyVendorStatusChanged } from "@/lib/email/notify";

/** See the guides route: `status` selects an approval decision, anything else is
 * a listing-detail edit, and only the former emails the vendor. */
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
      const parsed = hotelAdminDetailsSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
      }
      const updated = await prisma.hotel.update({ where: { id }, data: parsed.data });
      revalidateSite();
    return NextResponse.json(updated);
    }

    const parsed = vendorStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.hotel.update({
      where: { id },
      data: parsed.data,
      include: { owner: true },
    });

    await notifyVendorStatusChanged({
      email: updated.owner.email,
      listingName: updated.name,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
    });

    revalidateSite();
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
