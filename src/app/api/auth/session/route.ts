import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * "Am I still signed in?" — polled by the admin screens (AdminSessionGuard).
 * Requesting it is itself activity: the middleware extends the admin session
 * on the way through.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ signedIn: false }, { status: 401 });
  return NextResponse.json({ signedIn: true, role: user.role });
}
