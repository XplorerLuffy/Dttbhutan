import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { secretMatches } from "@/lib/gps/ingest";

/**
 * Lets the JT808 TCP server ask "is this tracker registered, and active?"
 * before it accepts a registration or authentication from it. Same shared
 * secret as /api/gps/ingest. Deliberately returns nothing about the vehicle,
 * operator or trips — the TCP server only learns yes/no, and never supplies
 * or receives a tenant identifier.
 */
export async function GET(req: NextRequest) {
  if (!secretMatches(process.env.GPS_INGEST_SECRET, req.headers.get("x-ingest-secret"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deviceIdentifier = req.nextUrl.searchParams.get("deviceIdentifier");
  if (!deviceIdentifier || deviceIdentifier.length > 64) {
    return NextResponse.json({ error: "deviceIdentifier required" }, { status: 400 });
  }
  const device = await prisma.gpsDevice.findUnique({
    where: { deviceIdentifier },
    select: { status: true },
  });
  return NextResponse.json({ registered: Boolean(device), active: device?.status === "ACTIVE" });
}
