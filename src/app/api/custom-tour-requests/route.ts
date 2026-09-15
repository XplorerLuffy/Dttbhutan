import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { customTourRequestSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Log in to request a custom tour" }, { status: 401 });
  if (user.role !== "TRAVELER") {
    return NextResponse.json({ error: "Only traveler accounts can request a custom tour" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = customTourRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { destinationIds, ...rest } = parsed.data;

  const request = await prisma.customTourRequest.create({
    data: {
      ...rest,
      travelerId: user.id,
      destinations: { connect: destinationIds.map((id) => ({ id })) },
    },
  });

  return NextResponse.json(request, { status: 201 });
}
