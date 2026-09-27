import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const saveSchema = z.object({
  itineraryId: z.string().min(1),
  departures: z
    .array(
      z.object({
        startDate: z.string().regex(ISO_DATE, "Use a YYYY-MM-DD date"),
        endDate: z.string().regex(ISO_DATE, "Use a YYYY-MM-DD date"),
        priceOverride: z.number().positive().max(10_000_000).nullable(),
        status: z.enum(["OPEN", "LIMITED", "SOLD_OUT", "CANCELLED"]),
        note: z.string().trim().max(120).nullable(),
      })
    )
    .max(200),
});

/**
 * Replaces one package's departures wholesale.
 *
 * Same shape as the content-section editor: the admin works on the whole
 * list, so saving it as one transaction avoids a per-row CRUD surface and
 * keeps ordering derived rather than stored.
 *
 * Existing rows are deleted and recreated, which drops the link from any
 * enquiry that referenced a departure. That relation is `onDelete: SetNull`,
 * so the enquiry survives with its subject line intact — losing the tie is
 * acceptable, losing the enquiry would not be.
 */
export async function PUT(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { itineraryId, departures } = parsed.data;

    const itinerary = await prisma.itinerary.findUnique({
      where: { id: itineraryId },
      select: { id: true, slug: true },
    });
    if (!itinerary) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const backwards = departures.find((d) => d.endDate < d.startDate);
    if (backwards) {
      return NextResponse.json(
        { error: `A departure ends (${backwards.endDate}) before it starts (${backwards.startDate}).` },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.departure.deleteMany({ where: { itineraryId } }),
      prisma.departure.createMany({
        data: departures.map((d) => ({
          itineraryId,
          startDate: new Date(`${d.startDate}T00:00:00Z`),
          endDate: new Date(`${d.endDate}T00:00:00Z`),
          priceOverride: d.priceOverride,
          status: d.status,
          note: d.note?.trim() || null,
        })),
      }),
    ]);

    revalidatePath(`/packages/${itinerary.slug}`);
    revalidatePath("/");

    return NextResponse.json({ saved: departures.length });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[admin/departures] save failed:", err);
    return NextResponse.json({ error: "Could not save departures." }, { status: 500 });
  }
}
