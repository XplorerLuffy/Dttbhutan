import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Temporary, admin-only: says which database this deployment is connected to,
 * without revealing any password. For the move to a new Supabase project.
 */
function describe(value: string | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return { host: url.hostname, port: url.port || null, user: decodeURIComponent(url.username), database: url.pathname.replace(/^\//, "") };
  } catch {
    return { unreadable: true };
  }
}

export async function GET() {
  try {
    await requireRole("ADMIN");
    return NextResponse.json({
      DATABASE_URL: describe(process.env.DATABASE_URL),
      DIRECT_URL: describe(process.env.DIRECT_URL),
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? null,
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
