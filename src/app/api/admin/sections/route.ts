import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SECTION_PAGE_IDS } from "@/lib/content/sections";

const MAX_BODY_LENGTH = 20_000;
const MAX_SECTIONS = 200;

const saveSchema = z.object({
  page: z.string().refine((p) => SECTION_PAGE_IDS.has(p), "Unknown page"),
  sections: z
    .array(
      z.object({
        group: z.string().max(200).nullable(),
        heading: z.string().min(1).max(500),
        body: z.string().max(MAX_BODY_LENGTH),
      })
    )
    .max(MAX_SECTIONS),
});

/**
 * Replaces a page's sections wholesale.
 *
 * The editor works on the whole ordered list at once, so saving it as one
 * transaction avoids a per-row CRUD surface plus a separate reorder
 * endpoint, and makes position a derived value rather than something two
 * requests can disagree about. Ids are not preserved across a save: nothing
 * references a section, so there is no reason to keep them stable.
 */
export async function PUT(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = saveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { page, sections } = parsed.data;

    await prisma.$transaction([
      prisma.contentSection.deleteMany({ where: { page } }),
      prisma.contentSection.createMany({
        data: sections.map((s, i) => ({
          page,
          group: s.group?.trim() || null,
          heading: s.heading.trim(),
          body: s.body,
          position: i,
        })),
      }),
    ]);

    revalidatePath(`/${page}`);
    // The FAQ and the legal pages are linked from the footer on every route,
    // and the homepage is prerendered, so refresh the shell too.
    revalidatePath("/", "layout");

    return NextResponse.json({ saved: sections.length });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[admin/sections] save failed:", err);
    return NextResponse.json({ error: "Could not save changes." }, { status: 500 });
  }
}
