import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { knowledgeAdminSchema } from "@/lib/validation";
import { reingestDocument, DocumentTooLargeError } from "@/lib/ai/ingestion";
import { getCurrentAgencyId } from "@/lib/ai/retrieval";

/** Saving re-embeds every chunk — see the note on the collection route. */
export const maxDuration = 60;

/**
 * Document kinds the dashboard may edit.
 *
 * ARTICLE, PACKAGE and DESTINATION documents are regenerated from their
 * database rows by syncSiteKnowledge and replaced wholesale on every refresh,
 * so a hand edit to one would appear to save and then vanish. Refusing here as
 * well as omitting them from the form means a stale tab or a hand-made request
 * can't get around it either.
 */
const EDITABLE_SOURCE_TYPES = new Set(["MANUAL", "FAQ", "POLICY", "UPLOAD"]);

/**
 * The agency check is not ceremony. Retrieval is filtered by agencyId, so
 * loading a document by id alone would let one tenant's dashboard edit
 * another's knowledge the moment this app serves more than one agency — and
 * this route would be the only place that ever allowed it.
 */
async function loadEditable(id: string) {
  const agencyId = await getCurrentAgencyId();
  if (!agencyId) return { error: "No agency is configured for this deployment.", status: 500 as const };

  const document = await prisma.knowledgeDocument.findUnique({
    where: { id },
    select: { id: true, agencyId: true, sourceType: true, title: true },
  });

  if (!document || document.agencyId !== agencyId) {
    return { error: "That knowledge document does not exist.", status: 404 as const };
  }
  if (!EDITABLE_SOURCE_TYPES.has(document.sourceType)) {
    return {
      error:
        `"${document.title}" is generated from the website's own content and is rewritten on every refresh. ` +
        `Edit the package, destination or article it came from instead.`,
      status: 409 as const,
    };
  }

  return { document };
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const body = await req.json().catch(() => null);
    const parsed = knowledgeAdminSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const loaded = await loadEditable(id);
    if ("error" in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    // sourceType stays as it was found. It decides whether this document is
    // editable at all, so letting the form change it would let an admin move a
    // document into (or out of) the machine-managed set by accident.
    const result = await reingestDocument({
      documentId: id,
      title: parsed.data.title,
      content: parsed.data.content,
      category: parsed.data.category ?? null,
      visibility: parsed.data.visibility,
      status: parsed.data.status,
    });

    return NextResponse.json(result);
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

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;

    const loaded = await loadEditable(id);
    if ("error" in loaded) {
      return NextResponse.json({ error: loaded.error }, { status: loaded.status });
    }

    // Chunks go with it — KnowledgeChunk.documentId is onDelete: Cascade, so
    // there is no way to leave orphaned text behind that retrieval could still
    // find after the document is gone.
    await prisma.knowledgeDocument.delete({ where: { id } });

    return NextResponse.json({ deleted: true });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
