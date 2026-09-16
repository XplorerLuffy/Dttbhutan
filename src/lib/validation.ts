import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().max(30).optional(),
  role: z.enum(["TRAVELER", "GUIDE", "HOTEL_OPERATOR", "TRANSPORT_OPERATOR"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const guideProfileSchema = z.object({
  licenseNumber: z.string().min(3).max(50),
  languages: z.array(z.string().min(1)).min(1),
  specialties: z.array(z.string().min(1)).min(1),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  ratePerDay: z.coerce.number().positive(),
  bio: z.string().max(2000).optional(),
  photoUrl: z.string().url().optional().or(z.literal("")),
  destinationIds: z.array(z.string().min(1)).default([]),
});

export const hotelSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(3000).optional(),
  destinationId: z.string().min(1),
  address: z.string().max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  amenities: z.array(z.string().min(1)).default([]),
  businessLicenseUrl: z.string().url().optional().or(z.literal("")),
  photoUrls: z.array(z.string().min(1)).default([]),
});

export const roomTypeSchema = z.object({
  name: z.string().min(1).max(100),
  capacity: z.coerce.number().int().positive().max(50),
  pricePerNight: z.coerce.number().positive(),
  totalRooms: z.coerce.number().int().positive().max(500),
});

export const hotelRegistrationSchema = z.object({
  hotel: hotelSchema,
  roomType: roomTypeSchema,
});

export const transportOperatorSchema = z.object({
  businessName: z.string().min(2).max(150),
  businessLicenseUrl: z.string().url().optional().or(z.literal("")),
});

export const transportRegistrationSchema = z.object({
  operator: transportOperatorSchema,
  vehicle: z.lazy(() => vehicleSchema),
});

export const vehicleSchema = z.object({
  type: z.enum(["SEDAN", "SUV", "VAN", "BUS"]),
  capacity: z.coerce.number().int().positive().max(80),
  plateNumber: z.string().min(2).max(20),
  driverName: z.string().min(2).max(100),
  driverLicenseNumber: z.string().min(2).max(50),
  ratePerDay: z.coerce.number().positive(),
  ratePerKm: z.coerce.number().positive().optional(),
  gpsDeviceIdentifier: z.string().min(1).max(100).optional(),
});

export const guideBookingSchema = z.object({
  type: z.literal("GUIDE"),
  guideId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const hotelBookingSchema = z.object({
  type: z.literal("HOTEL"),
  roomTypeId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});

export const vehicleBookingSchema = z.object({
  type: z.literal("VEHICLE"),
  vehicleId: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  plannedDistanceKm: z.coerce.number().positive(),
  plannedRoute: z
    .array(
      z.object({
        latitude: z.number().min(-90).max(90),
        longitude: z.number().min(-180).max(180),
        label: z.string().optional(),
      })
    )
    .min(2),
});

const flightLegSchema = z.object({
  airline: z.string().min(1),
  airlineCode: z.string().min(1),
  flightNumber: z.string().min(1),
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureAt: z.string().min(1),
  arrivalAt: z.string().min(1),
  durationMinutes: z.number().int().positive(),
});

export const flightOfferSchema = z.object({
  id: z.string().min(1),
  provider: z.literal("mock"),
  outbound: flightLegSchema,
  inbound: flightLegSchema.nullable(),
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),
  passengers: z.number().int().min(1).max(9),
  pricePerPassenger: z.number().positive(),
  totalPrice: z.number().positive(),
  currency: z.literal("BTN"),
  isBhutaneseCarrier: z.boolean(),
});

export const flightBookingSchema = z.object({
  type: z.literal("FLIGHT"),
  offer: flightOfferSchema,
});

export const itineraryBookingSchema = z.object({
  type: z.literal("ITINERARY"),
  itineraryId: z.string().min(1),
  startDate: z.coerce.date(),
  travelers: z.coerce.number().int().min(1).max(30),
  notes: z.string().max(2000).optional(),
});

export const bookingSchema = z
  .discriminatedUnion("type", [
    guideBookingSchema,
    hotelBookingSchema,
    vehicleBookingSchema,
    flightBookingSchema,
    itineraryBookingSchema,
  ])
  .refine((data) => data.type === "FLIGHT" || data.type === "ITINERARY" || data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export const itineraryDayInputSchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  destinationId: z.string().min(1).optional().or(z.literal("")),
  activities: z.array(z.string().min(1)).default([]),
  mealsIncluded: z.array(z.string().min(1)).default([]),
});

export const itineraryAdminSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  summary: z.string().min(2).max(500),
  description: z.string().max(5000).optional(),
  durationDays: z.coerce.number().int().min(1).max(60),
  pricePerPerson: z.coerce.number().positive(),
  maxGroupSize: z.coerce.number().int().positive().optional(),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  coverPhotoUrl: z.string().optional(),
  includes: z.array(z.string().min(1)).default([]),
  excludes: z.array(z.string().min(1)).default([]),
  days: z.array(itineraryDayInputSchema).min(1),
});

export const articleAdminSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  category: z.string().min(2).max(60),
  excerpt: z.string().min(2).max(300),
  content: z.string().min(2).max(20000),
  coverPhotoUrl: z.string().optional(),
  readMinutes: z.coerce.number().int().min(1).max(60),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

export const customTourRequestSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    travelers: z.coerce.number().int().min(1).max(30),
    budgetPerPerson: z.coerce.number().positive().optional(),
    notes: z.string().max(2000).optional(),
    destinationIds: z.array(z.string().min(1)).min(1),
    guideId: z.string().min(1).optional(),
    roomTypeId: z.string().min(1).optional(),
    vehicleId: z.string().min(1).optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
  });

export const customTourRequestAdminUpdateSchema = z.object({
  status: z.enum(["NEW", "IN_REVIEW", "QUOTED", "CLOSED"]),
  adminNote: z.string().max(2000).optional(),
});

export const flightSearchSchema = z.object({
  origin: z.string().trim().length(3),
  destination: z.string().trim().length(3),
  departureDate: z.string().min(1),
  returnDate: z.string().min(1).optional(),
  passengers: z.coerce.number().int().min(1).max(9),
  cabinClass: z.enum(["ECONOMY", "PREMIUM_ECONOMY", "BUSINESS", "FIRST"]),
});

export const reviewSchema = z.object({
  bookingId: z.string().min(1),
  rating: z.coerce.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export const messageSchema = z.object({
  bookingId: z.string().min(1),
  body: z.string().min(1).max(4000),
});

export const gpsIngestSchema = z.object({
  deviceIdentifier: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKmh: z.number().min(0).optional(),
  heading: z.number().min(0).max(360).optional(),
  recordedAt: z.coerce.date(),
});
