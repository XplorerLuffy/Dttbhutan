import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { vehicleSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("TRANSPORT_OPERATOR");
    const operator = await prisma.transportOperator.findUnique({
      where: { ownerId: user.id },
    });
    if (!operator) {
      return NextResponse.json({ error: "Register your business first" }, { status: 404 });
    }

    const body = await req.json().catch(() => null);
    const parsed = vehicleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { gpsDeviceIdentifier, ...vehicleData } = parsed.data;

    const plateTaken = await prisma.vehicle.findUnique({
      where: { plateNumber: vehicleData.plateNumber },
    });
    if (plateTaken) {
      return NextResponse.json(
        { error: "A vehicle with this plate number is already registered" },
        { status: 409 }
      );
    }

    const vehicle = await prisma.vehicle.create({
      data: {
        operatorId: operator.id,
        ...vehicleData,
        status: "PENDING",
        ...(gpsDeviceIdentifier
          ? { gpsDevice: { create: { deviceIdentifier: gpsDeviceIdentifier } } }
          : {}),
      },
    });

    return NextResponse.json(vehicle, { status: 201 });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
