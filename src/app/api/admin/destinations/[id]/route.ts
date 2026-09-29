import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidateHomepage } from "@/lib/revalidate";
import { destinationAdminSchema } from "@/lib/validation";

/**
 * Parsed `.partial()` so both callers work off one schema: the inline region
 * select on /admin/destinations sends `{ region }` alone, while the edit form
 * sends every field. An absent key then leaves that column untouched, which is
 * exactly what a partial update should do.
 */
const destinationUpdateSchema = destinationAdminSchema.partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const body = await req.json().catch(() => null);
    const parsed = destinationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const updated = await prisma.destination.update({
      where: { id },
      data: parsed.data,
    });

    revalidateHomepage();
    return NextResponse.json(updated);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    // `name` is unique in the schema, so renaming one dzongkhag onto another's
    // name is a real thing an admin can try. Without this it surfaces as a 500
    // and an unexplained failure in the form.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Another destination already uses that name." },
        { status: 409 }
      );
    }
    throw err;
  }
}
