import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { guideProfileSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("GUIDE");

    const existing = await prisma.guideProfile.findUnique({
      where: { userId: user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Guide profile already exists" },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = guideProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const profile = await prisma.guideProfile.create({
      data: {
        userId: user.id,
        licenseNumber: parsed.data.licenseNumber,
        languages: parsed.data.languages,
        specialties: parsed.data.specialties,
        yearsExperience: parsed.data.yearsExperience,
        ratePerDay: parsed.data.ratePerDay,
        bio: parsed.data.bio,
        photoUrl: parsed.data.photoUrl || null,
        // Every new listing starts PENDING: the TCB license number is
        // captured here but not verified against a live registry (no
        // public TCB verification API is confirmed to exist yet) — an
        // admin reviews and approves/rejects it manually before the guide
        // becomes bookable.
        status: "PENDING",
      },
    });

    return NextResponse.json({ id: profile.id, status: profile.status });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
