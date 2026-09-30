import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireRole, AuthError } from "@/lib/auth";
import { syncSiteKnowledge } from "@/lib/ai/siteKnowledge";
import { getCurrentAgencyId } from "@/lib/ai/retrieval";

/**
 * Re-indexing is one embedding call per chunk, so this needs the whole budget —
 * and the scope below exists so one request never needs more than that.
 */
export const maxDuration = 60;

/** "all" is deliberately absent: a full refresh is more embedding calls than a
 * serverless function has time for, so the dashboard asks for one kind at a
 * time. The CLI script (npm run ai:ingest) still does the lot in one go. */
const syncSchema = z.object({
  scope: z.enum(["packages", "destinations", "articles"]),
});

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = syncSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const agencyId = await getCurrentAgencyId();
    if (!agencyId) {
      return NextResponse.json(
        { error: "No agency is configured for this deployment." },
        { status: 500 }
      );
    }

    const summary = await syncSiteKnowledge(agencyId, parsed.data.scope);
    return NextResponse.json(summary);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
