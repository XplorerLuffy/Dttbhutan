import { NextRequest, NextResponse } from "next/server";
import { refreshRatesFromLiveSource } from "@/lib/fx";

/**
 * Refreshes the ExchangeRate table from a live source. Invoked on a
 * schedule by Vercel Cron (see vercel.json) using the CRON_SECRET env var
 * it sends automatically as an Authorization header, and can also be
 * triggered manually (e.g. an admin "Refresh now" button) with the same
 * secret as a query param.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET is not configured" }, { status: 500 });
  }
  const authHeader = req.headers.get("authorization");
  const queryToken = req.nextUrl.searchParams.get("secret");
  const authorized = authHeader === `Bearer ${secret}` || queryToken === secret;
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await refreshRatesFromLiveSource();
  return NextResponse.json(result, { status: result.failed.length > 0 && result.updated.length === 0 ? 502 : 200 });
}
