import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { articleAdminSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = articleAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await prisma.article.findUnique({ where: { slug: parsed.data.slug } });
    if (existing) {
      return NextResponse.json({ error: "That slug is already in use" }, { status: 409 });
    }

    const created = await prisma.article.create({ data: parsed.data });
    return NextResponse.json(created, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
