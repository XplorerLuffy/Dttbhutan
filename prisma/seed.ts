import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DZONGKHAGS } from "./data/dzongkhags";

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

  const admin = await upsertUser("admin@droelma.bt", "Agency Admin", "ADMIN");
  const traveler = await upsertUser("traveler@example.com", "Sonam Wangmo", "TRAVELER");

  // --- Destinations: all 20 dzongkhags -----------------------------------
  const destinationsByName: Record<string, Awaited<ReturnType<typeof prisma.destination.upsert>>> = {};
  for (const d of DZONGKHAGS) {
    destinationsByName[d.name] = await prisma.destination.upsert({
      where: { name: d.name },
      update: {},
      create: {
        name: d.name,
        slug: d.slug,
        region: d.region,
        description: d.description,
        highlights: d.highlights,
        latitude: d.latitude,
        longitude: d.longitude,
      },
    });
  }

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
      destinations: {
        connect: [
          { id: destinationsByName["Paro"].id },
          { id: destinationsByName["Thimphu"].id },
          { id: destinationsByName["Punakha"].id },
          { id: destinationsByName["Haa"].id },
        ],
      },
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
        destinationId: destinationsByName["Thimphu"].id,
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
        destinationId: destinationsByName["Punakha"].id,
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

  // --- Booking 5: confirmed flight (mock aggregator) --------------------
  const flightBooking = await prisma.booking.create({
    data: {
      travelerId: traveler.id,
      type: "FLIGHT",
      status: "CONFIRMED",
      startDate: daysFromNow(30),
      endDate: daysFromNow(30, 3),
      totalPrice: 14500,
    },
  });
  await prisma.flightBooking.create({
    data: {
      bookingId: flightBooking.id,
      origin: "PBH",
      destination: "BKK",
      departureAt: daysFromNow(30),
      passengers: 1,
      cabinClass: "ECONOMY",
      airline: "Drukair (Royal Bhutan Airlines)",
      flightNumber: "KB201",
      aggregatorProvider: "mock",
      aggregatorOfferId: "seed-mock-offer",
      pnr: "SEED42",
    },
  });

  // --- Itineraries: agency-authored package tours ------------------------
  const westernHighlights = await prisma.itinerary.upsert({
    where: { slug: "cultural-highlights-western-bhutan" },
    update: {},
    create: {
      title: "Cultural Highlights of Western Bhutan",
      slug: "cultural-highlights-western-bhutan",
      summary:
        "A 5-day introduction to Bhutan's most iconic sights — Tiger's Nest, the capital, and the former winter capital at Punakha.",
      description:
        "Our most popular package: a comfortable, guide-led loop through Paro, Thimphu, and Punakha, with a private vehicle throughout. Ideal for a first visit to Bhutan.",
      durationDays: 5,
      pricePerPerson: 45000,
      maxGroupSize: 8,
      difficulty: "MODERATE",
      status: "PUBLISHED",
      includes: [
        "Licensed English-speaking guide",
        "Private vehicle & driver",
        "3-star hotel accommodation",
        "All meals as specified",
        "Entrance fees to listed sites",
      ],
      excludes: [
        "International/domestic flights",
        "Sustainable Development Fee (SDF)",
        "Visa fee",
        "Personal expenses & tips",
      ],
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Arrive in Paro",
            description: "Land at Bhutan's only international airport and settle in.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Airport pickup", "Rinpung Dzong visit", "National Museum of Bhutan"],
            mealsIncluded: ["Dinner"],
          },
          {
            dayNumber: 2,
            title: "Hike to Tiger's Nest",
            description: "A half-day hike to Bhutan's most iconic monastery, perched on a cliffside.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Hike to Paro Taktsang (Tiger's Nest)"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 3,
            title: "Drive to Thimphu",
            description: "Explore the capital city's landmarks.",
            destinationId: destinationsByName["Thimphu"].id,
            activities: ["Buddha Dordenma statue", "Tashichho Dzong", "Weekend Market"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 4,
            title: "Drive to Punakha via Dochula Pass",
            description: "Stop at the 108-chorten pass before descending to the fertile Punakha valley.",
            destinationId: destinationsByName["Punakha"].id,
            activities: ["Dochula Pass", "Punakha Dzong", "Punakha Suspension Bridge"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 5,
            title: "Departure",
            description: "Transfer back to Paro for your onward flight.",
            destinationId: destinationsByName["Wangdue Phodrang"].id,
            activities: ["Optional Phobjikha Valley detour", "Transfer to Paro airport"],
            mealsIncluded: ["Breakfast"],
          },
        ],
      },
    },
  });

  await prisma.itinerary.upsert({
    where: { slug: "bumthang-spiritual-trail" },
    update: {},
    create: {
      title: "Bumthang Spiritual Trail",
      slug: "bumthang-spiritual-trail",
      summary: "A 4-day journey into Bhutan's spiritual heartland, via the royal seat at Trongsa.",
      description:
        "Central Bhutan sees far fewer visitors than the west — this package visits some of the country's oldest temples and the ancestral home of the royal family.",
      durationDays: 4,
      pricePerPerson: 38000,
      maxGroupSize: 6,
      difficulty: "EASY",
      status: "PUBLISHED",
      includes: ["Licensed guide", "Private vehicle & driver", "Hotel accommodation", "All meals"],
      excludes: ["Flights", "Sustainable Development Fee (SDF)", "Visa fee", "Personal expenses"],
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Drive to Trongsa",
            destinationId: destinationsByName["Trongsa"].id,
            activities: ["Trongsa Dzong", "Ta Dzong Royal Heritage Museum"],
            mealsIncluded: ["Breakfast", "Dinner"],
          },
          {
            dayNumber: 2,
            title: "Drive to Bumthang",
            destinationId: destinationsByName["Bumthang"].id,
            activities: ["Jambay Lhakhang", "Kurjey Lhakhang"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 3,
            title: "Bumthang valleys",
            destinationId: destinationsByName["Bumthang"].id,
            activities: ["Tamshing Monastery", "Local cheese & honey tasting"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 4,
            title: "Departure",
            destinationId: destinationsByName["Bumthang"].id,
            activities: ["Return transfer"],
            mealsIncluded: ["Breakfast"],
          },
        ],
      },
    },
  });

  // Delete-and-recreate rather than upsert: earlier seed runs created this
  // as a 1-day DRAFT, and an upsert's empty `update: {}` would leave that
  // stale content in place on re-seed. No booking references this specific
  // itinerary, so it's safe to drop and rebuild fresh every time.
  await prisma.itinerary.deleteMany({ where: { slug: "eastern-bhutan-discovery" } });
  await prisma.itinerary.create({
    data: {
      title: "Eastern Bhutan Discovery",
      slug: "eastern-bhutan-discovery",
      summary: "An off-the-beaten-path route through Bhutan's least-visited dzongkhags.",
      description:
        "Fewer than a handful of tour groups reach eastern Bhutan in a given year. This route trades the well-worn western circuit for remote monasteries, traditional weaving villages, and some of the country's most dramatic mountain roads.",
      durationDays: 7,
      pricePerPerson: 64000,
      maxGroupSize: 6,
      difficulty: "CHALLENGING",
      status: "PUBLISHED",
      coverPhotoUrl: null,
      includes: ["Licensed guide", "Private vehicle & driver", "Hotel/homestay accommodation", "All meals"],
      excludes: ["Flights", "Sustainable Development Fee (SDF)", "Visa fee", "Personal expenses"],
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Bumthang to Mongar",
            description: "A dramatic day of driving over the Thrumshing La pass, the gateway to eastern Bhutan.",
            destinationId: destinationsByName["Mongar"].id,
            activities: ["Thrumshing La pass", "Mongar Dzong"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 2,
            title: "Mongar to Trashigang",
            description: "Onward to the largest dzongkhag in the east, historically a trade hub on the route to Tibet.",
            destinationId: destinationsByName["Trashigang"].id,
            activities: ["Trashigang Dzong", "Gom Kora sacred site"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 3,
            title: "Trashigang to Trashiyangtse",
            description: "A quieter valley known for traditional wood-turning crafts and a sacred stupa.",
            destinationId: destinationsByName["Trashiyangtse"].id,
            activities: ["Chorten Kora", "Local wood-turning workshops"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 4,
            title: "Trashiyangtse to Lhuentse",
            description: "Home to Bhutan's finest hand-woven textiles and the royal family's ancestral roots.",
            destinationId: destinationsByName["Lhuentse"].id,
            activities: ["Lhuentse Dzong", "Kurtoep weaving villages"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 5,
            title: "Lhuentse valley exploration",
            description: "A full day exploring nearby villages and weaving workshops at a slower pace.",
            destinationId: destinationsByName["Lhuentse"].id,
            activities: ["Village walk", "Weaving demonstration"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 6,
            title: "Return to Mongar",
            description: "Retrace the route back toward central Bhutan, with a stop at a roadside viewpoint.",
            destinationId: destinationsByName["Mongar"].id,
            activities: ["Scenic viewpoints", "Free afternoon"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 7,
            title: "Departure via Bumthang",
            description: "Transfer back over Thrumshing La to Bumthang for onward domestic flight or road connection.",
            destinationId: destinationsByName["Bumthang"].id,
            activities: ["Return transfer"],
            mealsIncluded: ["Breakfast"],
          },
        ],
      },
    },
  });

  const culturalCircuit = await prisma.itinerary.upsert({
    where: { slug: "grand-bhutan-cultural-circuit" },
    update: {},
    create: {
      title: "Grand Bhutan Cultural Circuit",
      slug: "grand-bhutan-cultural-circuit",
      summary: "An 8-day loop through Paro, Thimphu, Punakha, and the glacial Phobjikha Valley — the fullest introduction to western Bhutan.",
      description:
        "For travelers who want more than a quick taste of Bhutan, this circuit adds the Phobjikha Valley and a slower pace in each town, with time built in for markets, museums, and unhurried walks alongside the major sights.",
      durationDays: 8,
      pricePerPerson: 68000,
      maxGroupSize: 10,
      difficulty: "MODERATE",
      status: "PUBLISHED",
      coverPhotoUrl: null,
      includes: [
        "Licensed English-speaking guide",
        "Private vehicle & driver",
        "3-star hotel accommodation",
        "All meals as specified",
        "Entrance fees to listed sites",
      ],
      excludes: [
        "International/domestic flights",
        "Sustainable Development Fee (SDF)",
        "Visa fee",
        "Personal expenses & tips",
      ],
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Arrive in Paro",
            description: "Land at Bhutan's only international airport and settle in.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Airport pickup", "Rinpung Dzong visit", "National Museum of Bhutan"],
            mealsIncluded: ["Dinner"],
          },
          {
            dayNumber: 2,
            title: "Hike to Tiger's Nest",
            description: "A half-day hike to Bhutan's most iconic monastery, perched on a cliffside.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Hike to Paro Taktsang (Tiger's Nest)"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 3,
            title: "Drive to Thimphu",
            description: "Explore the capital city's landmarks at an easy pace.",
            destinationId: destinationsByName["Thimphu"].id,
            activities: ["Buddha Dordenma statue", "Tashichho Dzong", "Memorial Chorten"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 4,
            title: "Thimphu markets & crafts",
            description: "A second day in the capital focused on local life and traditional craftsmanship.",
            destinationId: destinationsByName["Thimphu"].id,
            activities: ["Weekend Market (seasonal)", "Folk Heritage Museum", "Handicrafts workshops"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 5,
            title: "Drive to Punakha via Dochula Pass",
            description: "Stop at the 108-chorten pass before descending to the fertile Punakha valley.",
            destinationId: destinationsByName["Punakha"].id,
            activities: ["Dochula Pass", "Punakha Dzong", "Punakha Suspension Bridge"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 6,
            title: "Punakha to Phobjikha Valley",
            description: "A glacial valley where black-necked cranes winter each year, and home to Gangtey Monastery.",
            destinationId: destinationsByName["Wangdue Phodrang"].id,
            activities: ["Gangtey Monastery", "Phobjikha nature trail"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 7,
            title: "Return to Paro",
            description: "A scenic drive back with a stop at Wangdue Dzong ruins and free time for shopping.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Wangdue Dzong ruins viewpoint", "Free time / shopping"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 8,
            title: "Departure",
            description: "Transfer to Paro International Airport for your onward flight.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Transfer to airport"],
            mealsIncluded: ["Breakfast"],
          },
        ],
      },
    },
  });

  await prisma.itinerary.upsert({
    where: { slug: "jomolhari-base-camp-trek" },
    update: {},
    create: {
      title: "Jomolhari Base Camp Trek",
      slug: "jomolhari-base-camp-trek",
      summary: "A 9-day high-altitude trek to the base of sacred Mount Jomolhari, through yak-herding country and alpine lakes.",
      description:
        "One of Bhutan's classic treks, following the Paro Chhu valley up to the base of Mount Jomolhari (7,326m) before a rest day for acclimatization and optional side trip to the Tshophu lakes.",
      durationDays: 9,
      pricePerPerson: 98000,
      maxGroupSize: 8,
      difficulty: "CHALLENGING",
      status: "PUBLISHED",
      coverPhotoUrl: null,
      includes: [
        "Licensed trekking guide & camp crew",
        "Camping equipment & pack animals",
        "All trekking meals",
        "Pre/post-trek hotel in Paro",
      ],
      excludes: ["Flights", "Sustainable Development Fee (SDF)", "Visa fee", "Personal trekking gear", "Tips"],
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Arrive Paro, trek briefing",
            description: "Gear check and briefing with your trekking guide ahead of tomorrow's start.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Airport pickup", "Trek briefing & gear check"],
            mealsIncluded: ["Dinner"],
          },
          {
            dayNumber: 2,
            title: "Drive to Drukgyel, trek to Shana",
            description: "The trailhead starts at the ruined Drukgyel Dzong; today's walk follows the Paro Chhu river.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Drukgyel Dzong ruins", "Trek to Shana camp"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 3,
            title: "Shana to Thangthangka",
            description: "A long day through blue pine and fir forest, gaining altitude toward the high valley.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Forest trail trekking"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 4,
            title: "Thangthangka to Jangothang",
            description: "The trail opens up to reveal Mount Jomolhari — camp is set below the peak.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Jomolhari viewpoint", "Jangothang base camp"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 5,
            title: "Acclimatization day at Jangothang",
            description: "An optional side hike toward the Tshophu lakes to aid acclimatization and take in the views.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Optional Tshophu lakes side hike", "Rest"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 6,
            title: "Jangothang to Thangthangka (return)",
            description: "Begin the descent, retracing yesterday's high-altitude terrain.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Descent trekking"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 7,
            title: "Thangthangka to Shana",
            description: "Continue the descent back through the forested lower valley.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Forest trail trekking"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 8,
            title: "Shana to Drukgyel, drive to Paro",
            description: "The final trekking day ends back at the trailhead, with a hotel and hot shower waiting in Paro.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Trek end at Drukgyel", "Transfer to hotel"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 9,
            title: "Departure",
            description: "Transfer to Paro International Airport for your onward flight.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Transfer to airport"],
            mealsIncluded: ["Breakfast"],
          },
        ],
      },
    },
  });

  await prisma.itinerary.upsert({
    where: { slug: "bhutan-honeymoon-escape" },
    update: {},
    create: {
      title: "Bhutan Honeymoon Escape",
      slug: "bhutan-honeymoon-escape",
      summary: "A 6-day boutique-hotel itinerary through Paro, Thimphu, and Punakha, paced for couples rather than checklists.",
      description:
        "A gentler version of the classic western circuit — boutique accommodation, private vehicle throughout, and unhurried time built in at each stop, with a few romantic touches arranged along the way.",
      durationDays: 6,
      pricePerPerson: 82000,
      maxGroupSize: 2,
      difficulty: "EASY",
      status: "PUBLISHED",
      coverPhotoUrl: null,
      includes: [
        "Licensed guide",
        "Private vehicle & driver",
        "Boutique hotel accommodation",
        "All meals",
        "One private candlelit dinner",
      ],
      excludes: ["Flights", "Sustainable Development Fee (SDF)", "Visa fee", "Personal expenses"],
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Arrive in Paro",
            description: "Settle into a boutique stay with mountain views.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Airport pickup", "Rinpung Dzong at golden hour"],
            mealsIncluded: ["Dinner"],
          },
          {
            dayNumber: 2,
            title: "Hike to Tiger's Nest",
            description: "The signature hike, at a relaxed pace with plenty of stops.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Hike to Paro Taktsang (Tiger's Nest)"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 3,
            title: "Drive to Thimphu",
            description: "A relaxed day taking in the capital's landmarks.",
            destinationId: destinationsByName["Thimphu"].id,
            activities: ["Buddha Dordenma statue", "Tashichho Dzong"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 4,
            title: "Drive to Punakha via Dochula Pass",
            description: "One of Bhutan's most photogenic passes, followed by the fertile Punakha valley.",
            destinationId: destinationsByName["Punakha"].id,
            activities: ["Dochula Pass", "Punakha Dzong", "Punakha Suspension Bridge"],
            mealsIncluded: ["Breakfast", "Lunch"],
          },
          {
            dayNumber: 5,
            title: "Punakha at leisure",
            description: "A quiet day along the riverside, ending with a private dinner arranged by your guide.",
            destinationId: destinationsByName["Punakha"].id,
            activities: ["Riverside walk", "Private candlelit dinner"],
            mealsIncluded: ["Breakfast", "Dinner"],
          },
          {
            dayNumber: 6,
            title: "Return to Paro & departure",
            description: "A final scenic drive back to Paro for your onward flight.",
            destinationId: destinationsByName["Paro"].id,
            activities: ["Return transfer", "Transfer to airport"],
            mealsIncluded: ["Breakfast"],
          },
        ],
      },
    },
  });

  await prisma.itinerary.upsert({
    where: { slug: "central-bhutan-wildlife-heritage-trail" },
    update: {},
    create: {
      title: "Central Bhutan Wildlife & Heritage Trail",
      slug: "central-bhutan-wildlife-heritage-trail",
      summary: "A 6-day route through Trongsa, Bumthang, and Zhemgang — royal history, ancient temples, and Bhutan's richest wildlife habitat.",
      description:
        "Central Bhutan sees a fraction of the visitors the west does. This route combines the royal family's ancestral seat at Trongsa, the temple-dense valleys of Bumthang, and the subtropical forests of Zhemgang near Royal Manas National Park.",
      durationDays: 6,
      pricePerPerson: 56000,
      maxGroupSize: 8,
      difficulty: "MODERATE",
      status: "PUBLISHED",
      coverPhotoUrl: null,
      includes: ["Licensed guide", "Private vehicle & driver", "Hotel accommodation", "All meals"],
      excludes: ["Flights", "Sustainable Development Fee (SDF)", "Visa fee", "Personal expenses"],
      days: {
        create: [
          {
            dayNumber: 1,
            title: "Drive to Trongsa",
            description: "The ancestral seat of Bhutan's royal family, perched above the Mangde River gorge.",
            destinationId: destinationsByName["Trongsa"].id,
            activities: ["Trongsa Dzong", "Ta Dzong Royal Heritage Museum"],
            mealsIncluded: ["Breakfast", "Dinner"],
          },
          {
            dayNumber: 2,
            title: "Drive to Bumthang",
            description: "Considered Bhutan's spiritual heartland, home to some of its oldest temples.",
            destinationId: destinationsByName["Bumthang"].id,
            activities: ["Jambay Lhakhang", "Kurjey Lhakhang"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 3,
            title: "Bumthang valleys",
            description: "A full day exploring temples and local producers across the Bumthang valleys.",
            destinationId: destinationsByName["Bumthang"].id,
            activities: ["Tamshing Monastery", "Local cheese & honey tasting"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 4,
            title: "Drive to Zhemgang",
            description: "Descending into subtropical forest — a biodiversity hotspot near Royal Manas National Park.",
            destinationId: destinationsByName["Zhemgang"].id,
            activities: ["Zhemgang Dzong", "Forest nature walk"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 5,
            title: "Zhemgang wildlife & villages",
            description: "A day dedicated to spotting golden langurs and visiting nearby farming villages.",
            destinationId: destinationsByName["Zhemgang"].id,
            activities: ["Golden langur habitat viewing", "Village visit"],
            mealsIncluded: ["Breakfast", "Lunch", "Dinner"],
          },
          {
            dayNumber: 6,
            title: "Return via Trongsa, departure",
            description: "Retrace the route back toward Trongsa for onward road or flight connections.",
            destinationId: destinationsByName["Trongsa"].id,
            activities: ["Return transfer"],
            mealsIncluded: ["Breakfast"],
          },
        ],
      },
    },
  });

  // Traveler books the flagship package — starts PENDING, like guide/hotel/
  // vehicle bookings, since the agency still needs to assign the actual
  // guide, hotel rooms, and vehicle before confirming.
  const itineraryBookingRecord = await prisma.booking.create({
    data: {
      travelerId: traveler.id,
      type: "ITINERARY",
      status: "PENDING",
      startDate: daysFromNow(45),
      endDate: daysFromNow(45 + westernHighlights.durationDays),
      totalPrice: Number(westernHighlights.pricePerPerson) * 2,
    },
  });
  await prisma.itineraryBooking.create({
    data: {
      bookingId: itineraryBookingRecord.id,
      itineraryId: westernHighlights.id,
      travelers: 2,
      notes: "Celebrating our anniversary — a quieter hotel room if possible.",
    },
  });

  // --- A custom tour request (no fixed itinerary yet — agency to quote) --
  await prisma.customTourRequest.create({
    data: {
      travelerId: traveler.id,
      startDate: daysFromNow(120),
      endDate: daysFromNow(130),
      travelers: 2,
      budgetPerPerson: 60000,
      notes:
        "Interested in remote monasteries and local homestays rather than hotels. Flexible on exact dates in April.",
      status: "NEW",
      destinations: {
        connect: [
          { id: destinationsByName["Bumthang"].id },
          { id: destinationsByName["Trongsa"].id },
          { id: destinationsByName["Zhemgang"].id },
        ],
      },
    },
  });

  // --- Travel guide articles ------------------------------------------
  await prisma.article.upsert({
    where: { slug: "visa-and-entry-requirements-for-bhutan" },
    update: {},
    create: {
      title: "Visa & Entry Requirements for Bhutan",
      slug: "visa-and-entry-requirements-for-bhutan",
      category: "Visa & Entry",
      excerpt:
        "Almost every visitor to Bhutan needs a visa arranged in advance through a licensed local operator. Here's what that actually involves.",
      content: `Bhutan issues tourist visas only through licensed Bhutanese tour operators — you cannot apply directly to an embassy the way you might for most countries. In practice this means your operator (that's us) submits your passport details and travel dates to the Department of Immigration on your behalf once your trip and Sustainable Development Fee payment are confirmed.

The main exceptions are travelers from India, Bangladesh, and the Maldives, who can enter with a valid passport (or, for Indian nationals, a voter ID card) and a permit issued at the port of entry rather than a pre-approved visa.

For everyone else, the visa is typically approved within a few working days once your booking is confirmed, and the physical visa stamp is issued on arrival at Paro International Airport or at one of the land border crossings. We'll let you know exactly what we need from you — usually just a scanned passport copy and your travel dates — as soon as your trip is booked.`,
      coverPhotoUrl: null,
      readMinutes: 4,
      status: "PUBLISHED",
    },
  });

  await prisma.article.upsert({
    where: { slug: "bhutans-sustainable-development-fee-explained" },
    update: {},
    create: {
      title: "Bhutan's Sustainable Development Fee, Explained",
      slug: "bhutans-sustainable-development-fee-explained",
      category: "SDF Fee",
      excerpt:
        "Bhutan charges every international visitor a daily Sustainable Development Fee. Here's what it funds and how it factors into your trip cost.",
      content: `Bhutan is one of the only countries in the world that charges visitors a dedicated daily fee specifically earmarked for environmental and social programs, rather than folding tourism revenue into general taxation. This is the Sustainable Development Fee, usually shortened to SDF.

The fee is charged per person, per night of your stay, and is separate from what you pay for guides, hotels, transport, and meals. Bhutan's government has, at various points, adjusted the rate and offered discounts for longer stays and for regional visitors from India, Bangladesh, and the Maldives — so the exact figure depends on your nationality and travel dates.

In practice, you don't need to calculate this yourself: when you book a package or request a custom quote through Droelma, the SDF is itemized separately from the rest of your trip cost so you can see exactly what's going where. It's paid as part of your visa processing, before you arrive.`,
      coverPhotoUrl: null,
      readMinutes: 5,
      status: "PUBLISHED",
    },
  });

  await prisma.article.upsert({
    where: { slug: "best-time-to-visit-bhutan" },
    update: {},
    create: {
      title: "Best Time to Visit Bhutan",
      slug: "best-time-to-visit-bhutan",
      category: "Festivals & Seasons",
      excerpt:
        "Bhutan rewards visitors in every season, but spring and autumn are when the weather, views, and festival calendar line up best.",
      content: `Bhutan's tourist season peaks in spring (March to May) and autumn (September to November), when skies are generally clear, temperatures are mild across the western valleys, and most of the country's major religious festivals (tshechus) take place.

Spring brings blooming rhododendrons across the higher valleys and some of the clearest mountain views of the year, while autumn offers similarly reliable weather along with the rice harvest across the western dzongkhags. Both seasons are when most of the well-known tshechus — multi-day masked-dance festivals held at dzongs and monasteries — are scheduled, though exact dates shift each year with the lunar calendar.

Winter (December to February) is quieter and colder, especially at altitude, but skies are often crisp and clear, and it's a good time for travelers who want fewer crowds at sites like Paro's Tiger's Nest. Summer (June to August) brings the monsoon to most of the country, with heavier rain and cloud cover in the west, though central and eastern Bhutan see somewhat less rainfall.

If your dates are flexible, ask us about aligning your trip with a specific dzongkhag's festival — it's one of the best ways to see Bhutanese culture up close.`,
      coverPhotoUrl: null,
      readMinutes: 4,
      status: "PUBLISHED",
    },
  });

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
