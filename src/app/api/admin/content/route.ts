import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTENT_GROUPS, CONTENT_KEYS } from "@/lib/content/registry";
import { webAddress } from "@/lib/content";
import { parseSchedule, scheduleError } from "@/lib/officeHours";

const FIELDS = new Map(CONTENT_GROUPS.flatMap((g) => g.fields).map((f) => [f.key, f]));

/** Generous enough for a long paragraph, bounded so a single field can't be
 * used to push megabytes into the page. */
const MAX_VALUE_LENGTH = 5_000;

const updateSchema = z.object({
  values: z.record(z.string(), z.string().max(MAX_VALUE_LENGTH)),
});

export async function PUT(req: NextRequest) {
  try {
    const admin = await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    // Only keys the registry declares are writable. Without this the
    // endpoint would let an admin (or anything that got hold of an admin
    // session) write unbounded arbitrary rows into the table.
    const entries = Object.entries(parsed.data.values).filter(([key]) => CONTENT_KEYS.has(key));
    const rejected = Object.keys(parsed.data.values).filter((key) => !CONTENT_KEYS.has(key));
    if (rejected.length > 0) {
      return NextResponse.json(
        { error: `Unknown content keys: ${rejected.slice(0, 5).join(", ")}` },
        { status: 400 }
      );
    }

    // Fields with a format are checked on the way in, so a bad value is
    // refused with a reason instead of being saved and quietly ignored.
    for (const [key, value] of entries) {
      const field = FIELDS.get(key);
      if (!field || !value.trim()) continue; // blank = back to the default
      if (field.type === "hours") {
        const schedule = parseSchedule(value);
        const problem = schedule ? scheduleError(schedule) : "Opening hours weren't understood.";
        if (problem) return NextResponse.json({ error: problem }, { status: 400 });
      } else if (field.type === "url") {
        if (!webAddress(value)) {
          return NextResponse.json(
            { error: `${field.label}: enter a web address, like https://facebook.com/yourpage` },
            { status: 400 }
          );
        }
      }
    }

    await prisma.$transaction(
      entries.map(([key, value]) =>
        prisma.siteContent.upsert({
          where: { key },
          create: { key, value, updatedBy: admin.id },
          update: { value, updatedBy: admin.id },
        })
      )
    );

    // Pages are prerendered, so without this an edit doesn't appear until the
    // next deploy — which would make the whole content admin pointless. The
    // "layout" scope covers every route under the root layout, because the
    // footer reads company details and is on all of them.
    revalidatePath("/", "layout");

    return NextResponse.json({ saved: entries.length });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[admin/content] save failed:", err);
    return NextResponse.json({ error: "Could not save changes." }, { status: 500 });
  }
}
