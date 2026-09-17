import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { vendorStatusUpdateSchema } from "@/lib/adminVendor";
import { notifyVendorStatusChanged } from "@/lib/email/notify";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json().catch(() => null);
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
    throw err;
  }
}
