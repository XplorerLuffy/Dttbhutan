import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole, AuthError } from "@/lib/auth";
import { hotelRegistrationSchema } from "@/lib/validation";

export async function POST(req: NextRequest) {
  try {
    const user = await requireRole("HOTEL_OPERATOR");

    const existing = await prisma.hotel.findUnique({
      where: { ownerId: user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "Hotel already registered" },
        { status: 409 }
      );
    }

    const body = await req.json().catch(() => null);
    const parsed = hotelRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { hotel, roomType } = parsed.data;

    const created = await prisma.hotel.create({
      data: {
        ownerId: user.id,
        name: hotel.name,
        description: hotel.description,
        location: hotel.location,
        address: hotel.address,
        latitude: hotel.latitude,
        longitude: hotel.longitude,
        amenities: hotel.amenities,
        businessLicenseUrl: hotel.businessLicenseUrl || null,
        status: "PENDING",
        roomTypes: {
          create: {
            name: roomType.name,
            capacity: roomType.capacity,
            pricePerNight: roomType.pricePerNight,
            totalRooms: roomType.totalRooms,
          },
        },
      },
      include: { roomTypes: true },
    });

    return NextResponse.json({ id: created.id, status: created.status });
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    throw err;
  }
}
