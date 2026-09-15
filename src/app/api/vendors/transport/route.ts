import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { transportRegistrationSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("TRANSPORT_OPERATOR");

    const existing = await prisma.transportOperator.findUnique({
      where: { ownerId: user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Transport operator already registered" },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = transportRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { operator, vehicle } = parsed.data;

    const plateTaken = await prisma.vehicle.findUnique({
      where: { plateNumber: vehicle.plateNumber },
    });
    if (plateTaken) {
      return NextResponse.json(
        { error: "A vehicle with this plate number is already registered" },
        { status: 409 }
      );
    }

    const created = await prisma.$transaction(async (tx) => {
      const op = await tx.transportOperator.create({
        data: {
          ownerId: user.id,
          businessName: operator.businessName,
          businessLicenseUrl: operator.businessLicenseUrl || null,
          status: "PENDING",
        },
      });

      const createdVehicle = await tx.vehicle.create({
        data: {
          operatorId: op.id,
          type: vehicle.type,
          capacity: vehicle.capacity,
          plateNumber: vehicle.plateNumber,
          driverName: vehicle.driverName,
          driverLicenseNumber: vehicle.driverLicenseNumber,
          ratePerDay: vehicle.ratePerDay,
          ratePerKm: vehicle.ratePerKm,
          status: "PENDING",
        },
      });

      // If a GPS device identifier was supplied (e.g. the vehicle's
      // hardware IMEI, once confirmed with the client and registered on
      // the Traccar server), link it now so trip mileage can be verified
      // from day one. It's optional at registration time since the
      // physical install may lag the paperwork.
      if (vehicle.gpsDeviceIdentifier) {
        await tx.gpsDevice.create({
          data: {
            vehicleId: createdVehicle.id,
            deviceIdentifier: vehicle.gpsDeviceIdentifier,
          },
        });
      }

      return op;
    });

    return NextResponse.json({ id: created.id, status: created.status });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
