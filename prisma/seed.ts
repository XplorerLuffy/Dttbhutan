import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Deliberately duplicated (rather than imported from src/lib/gps/distance.ts,
// which is marked "server-only") so this seed script has no dependency on
// the Next.js app's module graph.
const EARTH_RADIUS_KM = 6371;
function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h));
}
function trackDistanceKm(points: { lat: number; lng: number }[]) {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineKm(points[i - 1], points[i]);
  return total;
}

const PARO = { lat: 27.4305, lng: 89.4133 };
const THIMPHU = { lat: 27.4712, lng: 89.6339 };
const PUNAKHA = { lat: 27.5921, lng: 89.8797 };

async function upsertUser(email: string, name: string, role: "TRAVELER" | "GUIDE" | "HOTEL_OPERATOR" | "TRANSPORT_OPERATOR" | "ADMIN", password = "password123") {
  const passwordHash = await bcrypt.hash(password, 10);
  return prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, name, role, passwordHash, phone: "+975 17000000" },
  });
}

async function main() {
  console.log("Seeding...");

  const admin = await upsertUser("admin@dttbhutan.bt", "Agency Admin", "ADMIN");
  const traveler = await upsertUser("traveler@example.com", "Sonam Wangmo", "TRAVELER");

  // --- Guides -------------------------------------------------------------
  const guideUser1 = await upsertUser("pemba.guide@example.com", "Pemba Sherpa", "GUIDE");
  const guide1 = await prisma.guideProfile.upsert({
    where: { userId: guideUser1.id },
    update: {},
    create: {
      userId: guideUser1.id,
      licenseNumber: "TCB-GD-2019-0142",
      languages: ["English", "Dzongkha", "Hindi"],
      specialties: ["Trekking", "Cultural", "Historical"],
      yearsExperience: 8,
      ratePerDay: 2500,
      bio: "Licensed TCB guide specializing in high-altitude treks and monastery tours.",
      status: "APPROVED",
    },
  });

  const guideUser2 = await upsertUser("karma.guide@example.com", "Karma Dorji", "GUIDE");
  await prisma.guideProfile.upsert({
    where: { userId: guideUser2.id },
    update: {},
    create: {
      userId: guideUser2.id,
      licenseNumber: "TCB-GD-2023-0871",
      languages: ["English", "Dzongkha"],
      specialties: ["Adventure", "Wildlife"],
      yearsExperience: 2,
      ratePerDay: 1800,
      bio: "New guide awaiting license verification.",
      status: "PENDING",
    },
  });

  // --- Hotels ---------------------------------------------------------------
  const hotelOwner1 = await upsertUser("owner@tsheringhotel.bt", "Tshering Hotel Group", "HOTEL_OPERATOR");
  const existingHotel1 = await prisma.hotel.findUnique({ where: { ownerId: hotelOwner1.id } });
  const hotel1 =
    existingHotel1 ??
    (await prisma.hotel.create({
      data: {
        ownerId: hotelOwner1.id,
        name: "Tshering Boutique Hotel",
        description: "A cozy boutique hotel with mountain views in the heart of Thimphu.",
        location: "Thimphu",
        address: "Norzin Lam, Thimphu",
        latitude: THIMPHU.lat,
        longitude: THIMPHU.lng,
        amenities: ["WiFi", "Breakfast included", "Mountain view", "Parking"],
        status: "APPROVED",
        roomTypes: {
          create: [
            { name: "Deluxe Double", capacity: 2, pricePerNight: 3200, totalRooms: 6 },
            { name: "Suite", capacity: 3, pricePerNight: 5200, totalRooms: 2 },
          ],
        },
      },
      include: { roomTypes: true },
    }));
  const hotel1WithRooms = await prisma.hotel.findUniqueOrThrow({
    where: { id: hotel1.id },
    include: { roomTypes: true },
  });

  const hotelOwner2 = await upsertUser("owner@punakhastay.bt", "Punakha Homestay", "HOTEL_OPERATOR");
  const existingHotel2 = await prisma.hotel.findUnique({ where: { ownerId: hotelOwner2.id } });
  if (!existingHotel2) {
    await prisma.hotel.create({
      data: {
        ownerId: hotelOwner2.id,
        name: "Punakha Riverside Homestay",
        location: "Punakha",
        amenities: ["WiFi", "Home-cooked meals"],
        status: "PENDING",
        roomTypes: { create: [{ name: "Family Room", capacity: 4, pricePerNight: 1800, totalRooms: 3 }] },
      },
    });
  }

  // --- Transport --------------------------------------------------------
  const transportOwner1 = await upsertUser("dispatch@druktransport.bt", "Druk Transport", "TRANSPORT_OPERATOR");
  const operator1 = await prisma.transportOperator.upsert({
    where: { ownerId: transportOwner1.id },
    update: {},
    create: {
      ownerId: transportOwner1.id,
      businessName: "Druk Transport Services",
      status: "APPROVED",
    },
  });

  const vehicle1 = await prisma.vehicle.upsert({
    where: { plateNumber: "BP-1-A1234" },
    update: {},
    create: {
      operatorId: operator1.id,
      type: "SUV",
      capacity: 6,
      plateNumber: "BP-1-A1234",
      driverName: "Dorji Wangchuk",
      driverLicenseNumber: "DL-2015-9981",
      ratePerDay: 3500,
      ratePerKm: 15,
      status: "APPROVED",
    },
  });
  await prisma.gpsDevice.upsert({
    where: { vehicleId: vehicle1.id },
    update: {},
    create: { vehicleId: vehicle1.id, deviceIdentifier: "IMEI-TEST-0001", protocol: "osmand" },
  });

  const vehicle2 = await prisma.vehicle.upsert({
    where: { plateNumber: "BP-1-B5678" },
    update: {},
    create: {
      operatorId: operator1.id,
      type: "VAN",
      capacity: 10,
      plateNumber: "BP-1-B5678",
      driverName: "Tandin Phuntsho",
      driverLicenseNumber: "DL-2018-2214",
      ratePerDay: 4200,
      ratePerKm: 18,
      status: "APPROVED",
    },
  });
  const gpsDevice2 = await prisma.gpsDevice.upsert({
    where: { vehicleId: vehicle2.id },
    update: {},
    create: { vehicleId: vehicle2.id, deviceIdentifier: "IMEI-TEST-0002", protocol: "osmand" },
  });

  const transportOwner2 = await upsertUser("dispatch@bhutanrides.bt", "Bhutan Rides", "TRANSPORT_OPERATOR");
  const operator2 = await prisma.transportOperator.upsert({
    where: { ownerId: transportOwner2.id },
    update: {},
    create: { ownerId: transportOwner2.id, businessName: "Bhutan Rides Co.", status: "PENDING" },
  });
  await prisma.vehicle.upsert({
    where: { plateNumber: "BP-2-C9012" },
    update: {},
    create: {
      operatorId: operator2.id,
      type: "SEDAN",
      capacity: 4,
      plateNumber: "BP-2-C9012",
      driverName: "Ugyen Namgay",
      driverLicenseNumber: "DL-2021-5567",
      ratePerDay: 2200,
      status: "PENDING",
    },
  });

  // --- Booking 1: completed guide tour, with a review and messages ------
  const guideBooking = await prisma.booking.create({
    data: {
      travelerId: traveler.id,
      type: "GUIDE",
      guideId: guide1.id,
      status: "COMPLETED",
      startDate: daysFromNow(-14),
      endDate: daysFromNow(-10),
      totalPrice: 4 * 2500,
    },
  });
  await prisma.message.createMany({
    data: [
      { bookingId: guideBooking.id, senderId: traveler.id, body: "Looking forward to the trek!" },
      { bookingId: guideBooking.id, senderId: guideUser1.id, body: "Great, I'll meet you at the hotel at 7am." },
    ],
  });
  await prisma.review.create({
    data: {
      bookingId: guideBooking.id,
      travelerId: traveler.id,
      targetType: "GUIDE",
      targetId: guide1.id,
      rating: 5,
      comment: "Pemba was fantastic — very knowledgeable and easy to talk to.",
    },
  });

  // --- Booking 2: upcoming hotel stay ------------------------------------
  await prisma.booking.create({
    data: {
      travelerId: traveler.id,
      type: "HOTEL",
      roomTypeId: hotel1WithRooms.roomTypes[0].id,
      status: "CONFIRMED",
      startDate: daysFromNow(20),
      endDate: daysFromNow(24),
      totalPrice: 4 * Number(hotel1WithRooms.roomTypes[0].pricePerNight),
    },
  });

  // --- Booking 3: completed vehicle trip demonstrating the mileage dispute
  // The driver quoted/charged for 90 km (Paro -> Thimphu "via the long way").
  // The GPS trail proves the vehicle actually drove far less than that —
  // exactly the over-reporting problem this module exists to catch.
  const plannedDistanceKm = 90;
  const tripStart = daysFromNow(-10);
  const disputeBooking = await prisma.booking.create({
    data: {
      travelerId: traveler.id,
      type: "VEHICLE",
      vehicleId: vehicle1.id,
      status: "COMPLETED",
      startDate: tripStart,
      endDate: daysFromNow(-10, 3),
      totalPrice: 1 * 3500 + plannedDistanceKm * 15,
    },
  });

  const disputeTrip = await prisma.trip.create({
    data: {
      bookingId: disputeBooking.id,
      vehicleId: vehicle1.id,
      status: "COMPLETED",
      plannedDistanceKm,
      plannedRoute: [
        { label: "Paro", latitude: PARO.lat, longitude: PARO.lng },
        { label: "Thimphu", latitude: THIMPHU.lat, longitude: THIMPHU.lng },
      ],
      startedAt: tripStart,
      endedAt: new Date(tripStart.getTime() + 90 * 60 * 1000),
    },
  });

  // Realistic-ish waypoints along the actual Paro-Thimphu road corridor —
  // enough intermediate points for a believable GPS trail whose total
  // haversine distance comes out well under the 90 km quoted.
  const disputeWaypoints = [
    PARO,
    { lat: 27.4383, lng: 89.4529 },
    { lat: 27.4458, lng: 89.4981 },
    { lat: 27.4520, lng: 89.5443 },
    { lat: 27.4602, lng: 89.5867 },
    { lat: 27.4671, lng: 89.6122 },
    THIMPHU,
  ];
  const device1 = await prisma.gpsDevice.findUniqueOrThrow({ where: { vehicleId: vehicle1.id } });
  for (const [i, pt] of disputeWaypoints.entries()) {
    await prisma.gpsPosition.create({
      data: {
        deviceId: device1.id,
        tripId: disputeTrip.id,
        latitude: pt.lat,
        longitude: pt.lng,
        speedKmh: 45 + (i % 3) * 5,
        heading: 90,
        recordedAt: new Date(tripStart.getTime() + i * 12 * 60 * 1000),
      },
    });
  }

  const actualDistanceKm = trackDistanceKm(disputeWaypoints);
  const deviationKm = actualDistanceKm - plannedDistanceKm;
  const deviationPercent = (deviationKm / plannedDistanceKm) * 100;
  const flagThreshold = Number(process.env.GPS_DEVIATION_FLAG_PERCENT ?? 15);
  const flagged = Math.abs(deviationPercent) >= flagThreshold;

  await prisma.tripDistanceReport.upsert({
    where: { tripId: disputeTrip.id },
    update: {},
    create: {
      tripId: disputeTrip.id,
      actualDistanceKm,
      plannedDistanceKm,
      deviationKm,
      deviationPercent,
      flagged,
      flagReason: flagged
        ? `Actual GPS distance is ${Math.abs(deviationPercent).toFixed(1)}% lower than the planned/quoted route — the vehicle drove far less than what was charged for.`
        : null,
      startLatitude: disputeWaypoints[0].lat,
      startLongitude: disputeWaypoints[0].lng,
      endLatitude: disputeWaypoints[disputeWaypoints.length - 1].lat,
      endLongitude: disputeWaypoints[disputeWaypoints.length - 1].lng,
      pointCount: disputeWaypoints.length,
    },
  });

  // --- Booking 4: active vehicle trip, for the live-tracking demo -------
  const activeBooking = await prisma.booking.create({
    data: {
      travelerId: traveler.id,
      type: "VEHICLE",
      vehicleId: vehicle2.id,
      status: "CONFIRMED",
      startDate: daysFromNow(0),
      endDate: daysFromNow(2),
      totalPrice: 2 * 4200 + 70 * 18,
    },
  });
  const activeTripStart = new Date(Date.now() - 40 * 60 * 1000);
  const activeTrip = await prisma.trip.create({
    data: {
      bookingId: activeBooking.id,
      vehicleId: vehicle2.id,
      status: "IN_PROGRESS",
      plannedDistanceKm: 70,
      plannedRoute: [
        { label: "Thimphu", latitude: THIMPHU.lat, longitude: THIMPHU.lng },
        { label: "Punakha", latitude: PUNAKHA.lat, longitude: PUNAKHA.lng },
      ],
      startedAt: activeTripStart,
    },
  });
  const activeWaypoints = [
    THIMPHU,
    { lat: 27.51, lng: 89.72 },
    { lat: 27.545, lng: 89.79 },
  ];
  for (const [i, pt] of activeWaypoints.entries()) {
    await prisma.gpsPosition.create({
      data: {
        deviceId: gpsDevice2.id,
        tripId: activeTrip.id,
        latitude: pt.lat,
        longitude: pt.lng,
        speedKmh: 40,
        heading: 120,
        recordedAt: new Date(activeTripStart.getTime() + i * 15 * 60 * 1000),
      },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login:", admin.email, "/ password123");
  console.log("Traveler login:", traveler.email, "/ password123");
  console.log("Guide login:", guideUser1.email, "/ password123");
  console.log("Hotel operator login:", hotelOwner1.email, "/ password123");
  console.log("Transport operator login:", transportOwner1.email, "/ password123");
  console.log(
    `Dispute demo trip: /admin/gps/trips/${disputeTrip.id} (planned ${plannedDistanceKm}km vs actual ${actualDistanceKm.toFixed(1)}km)`
  );
}

function daysFromNow(days: number, extraHours = 0) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + extraHours);
  return d;
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
