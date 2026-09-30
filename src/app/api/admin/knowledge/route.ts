import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { knowledgeAdminSchema } from "@/lib/validation";
import { ingestDocument, DocumentTooLargeError } from "@/lib/ai/ingestion";
import { getCurrentAgencyId } from "@/lib/ai/retrieval";

/**
 * Creating a knowledge document embeds it, and an embedding provider is a
 * network call per chunk — a long policy page is comfortably more than the
 * default budget allows.
 */
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    await requireRole("ADMIN");

    const body = await req.json().catch(() => null);
    const parsed = knowledgeAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const agencyId = await getCurrentAgencyId();
    if (!agencyId) {
      return NextResponse.json(
        { error: "No agency is configured for this deployment, so knowledge has nowhere to live." },
        { status: 500 }
      );
    }

    // No sourceRef: hand-authored knowledge isn't a copy of anything, so
    // there's no earlier version for ingestion to replace. That also keeps two
    // documents with the same title from silently overwriting one another.
    const result = await ingestDocument({
      agencyId,
      title: parsed.data.title,
      content: parsed.data.content,
      sourceType: parsed.data.sourceType,
      category: parsed.data.category ?? undefined,
      visibility: parsed.data.visibility,
      status: parsed.data.status,
    });

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    if (err instanceof DocumentTooLargeError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    throw err;
  }
}
