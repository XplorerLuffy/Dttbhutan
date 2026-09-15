import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { itineraryAdminSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = itineraryAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { days, ...itinerary } = parsed.data;

    const existing = await prisma.itinerary.findUnique({ where: { slug: itinerary.slug } });
    if (existing) {
      return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    }

    const created = await prisma.itinerary.create({
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

    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
