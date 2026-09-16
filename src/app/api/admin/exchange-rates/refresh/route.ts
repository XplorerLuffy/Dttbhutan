import { NextResponse } from "next/server";
import { requireRole, AuthError } from "@/lib/auth";
import { refreshRatesFromLiveSource } from "@/lib/fx";

export async function POST() {
  try {
    await requireRole("ADMIN");
    const result = await refreshRatesFromLiveSource();
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
