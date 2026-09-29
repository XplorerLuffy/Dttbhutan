import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { vendorStatusUpdateSchema } from "@/lib/adminVendor";
import { vehicleAdminDetailsSchema } from "@/lib/validation";
import { notifyVendorStatusChanged } from "@/lib/email/notify";

/** See the guides route: `status` selects an approval decision, anything else is
 * a listing-detail edit, and only the former emails the operator. */
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
      const details = vehicleAdminDetailsSchema.safeParse(body);
      if (!details.success) {
        return NextResponse.json({ error: details.error.flatten() }, { status: 400 });
      }
      const updated = await prisma.vehicle.update({ where: { id }, data: details.data });
      return NextResponse.json(updated);
    }

    const parsed = vendorStatusUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.vehicle.update({
      where: { id },
      data: parsed.data,
      include: { operator: { include: { owner: true } } },
    });

    await notifyVendorStatusChanged({
      email: updated.operator.owner.email,
      listingName: `${updated.type} (${updated.plateNumber})`,
      status: parsed.data.status,
      adminNote: parsed.data.adminNote,
    });

    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    // plateNumber is unique across the fleet, and correcting a typo onto another
    // vehicle's plate is an easy mistake to make from the edit form.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Another vehicle already uses that plate number." },
        { status: 409 }
      );
    }
    throw err;
  }
}
