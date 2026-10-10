import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { revalidateSite } from "@/lib/revalidate";

const photosSchema = z.object({
  photoUrls: z.array(z.string().min(1).max(500)).max(10),
});

/** An operator changes the photos of their own business. */
export async function PATCH(req: NextRequest) {
  try {
    const user = await requireRole("TRANSPORT_OPERATOR");
    const parsed = photosSchema.safeParse(await req.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ error: "Check the photos and try again" }, { status: 400 });
    }
    const operator = await prisma.transportOperator.findUnique({ where: { ownerId: user.id } });
    if (!operator) return NextResponse.json({ error: "Register your business first" }, { status: 404 });

    await prisma.transportOperator.update({
      where: { id: operator.id },
      data: { photoUrls: parsed.data.photoUrls },
    });
    revalidateSite();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
