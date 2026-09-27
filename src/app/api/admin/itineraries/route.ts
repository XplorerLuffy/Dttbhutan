import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { itineraryAdminSchema } from "@/lib/validation";
import { revalidateHomepage } from "@/lib/revalidate";
import { writeItineraryDaysAndLodgings } from "@/lib/itinerary-write";

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = itineraryAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { days, lodgings, photos, ...itinerary } = parsed.data;

    const existing = await prisma.itinerary.findUnique({ where: { slug: itinerary.slug } });
    if (existing) {
      return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    }

    const created = await prisma.$transaction(async (tx) => {
      const row = await tx.itinerary.create({ data: itinerary });
      await writeItineraryDaysAndLodgings(tx, row.id, days, lodgings, photos);
      return row;
    });

    revalidateHomepage();
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
