import { NextRequest, NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { generateTripDistanceReport } from "@/lib/gps/report";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("ADMIN");
    const { id } = await params;
    const report = await generateTripDistanceReport(id);
    return NextResponse.json(report);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
