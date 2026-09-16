import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { itineraryAdminSchema } from "@/lib/validation";

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
    const { days, ...itinerary } = parsed.data;

    const existing = await prisma.itinerary.findUnique({ where: { slug: itinerary.slug } });
    if (existing && existing.id !== id) {
      return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    }

    // Simplest correct way to sync days on edit: replace the set entirely
    // rather than diffing by id (the admin form doesn't track per-day ids
    // across edits).
    const updated = await prisma.$transaction(async (tx) => {
      await tx.itineraryDay.deleteMany({ where: { itineraryId: id } });
      return tx.itinerary.update({
        where: { id },
        data: {
          ...itinerary,
          days: {
            create: days.map((d) => ({
              dayNumber: d.dayNumber,
              title: d.title,
              description: d.description,
              destinationId: d.destinationId || null,
              activities: d.activities,
              mealsIncluded: d.mealsIncluded,
            })),
          },
        },
      });
    });

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

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
