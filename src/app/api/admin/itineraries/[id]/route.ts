import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { itineraryAdminSchema } from "@/lib/validation";
import { revalidateHomepage } from "@/lib/revalidate";
import { writeItineraryDaysAndLodgings } from "@/lib/itinerary-write";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = itineraryAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { days, lodgings, photos, ...itinerary } = parsed.data;

    const existing = await prisma.itinerary.findUnique({ where: { slug: itinerary.slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    }

    // Simplest correct way to sync days on edit: replace the set entirely
    // rather than diffing by id (the admin form doesn't track per-day ids
    // across edits). Lodgings go the same way and in the same transaction,
    // because days reference them by position in the submitted list.
    const updated = await prisma.$transaction(async (tx) => {
      await tx.itineraryDay.deleteMany({ where: { itineraryId: id } });
      await tx.itineraryLodging.deleteMany({ where: { itineraryId: id } });
      await tx.itineraryPhoto.deleteMany({ where: { itineraryId: id } });
      const row = await tx.itinerary.update({ where: { id }, data: itinerary });
      await writeItineraryDaysAndLodgings(tx, id, days, lodgings, photos);
      return row;
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const bookingCount = await prisma.itineraryBooking.count({ where: { itineraryId: id } });
    if (bookingCount > 0) {
      return NextResponse.json(
        {
          error: `Can't delete — ${bookingCount} traveler booking${bookingCount === 1 ? "" : "s"} reference this package. Archive it instead.`,
        },
        { status: 409 }
      );
    }

    // ItineraryDay rows cascade via the schema's onDelete: Cascade.
    await prisma.itinerary.delete({ where: { id } });

    revalidateHomepage();
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
