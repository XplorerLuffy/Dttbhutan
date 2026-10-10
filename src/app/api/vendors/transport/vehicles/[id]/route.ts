import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";

const photosSchema = z.object({
  photoUrls: z.array(z.string().min(1).max(500)).max(10),
});

/** An operator changes the photos of one of their own vehicles. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireRole("TRANSPORT_OPERATOR");
    const { id } = await params;

    const parsed = photosSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Check the photos and try again" }, { status: 400 });
    }

    // Scoped by owner, so one operator can't touch another's vehicle.
    const vehicle = await prisma.vehicle.findFirst({
      where: { id, operator: { ownerId: user.id } },
      select: { id: true },
    });
    if (!vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 });

    await prisma.vehicle.update({ where: { id }, data: { photoUrls: parsed.data.photoUrls } });
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
