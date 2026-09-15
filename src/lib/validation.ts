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
});

export const hotelSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(3000).optional(),
  location: z.string().min(2).max(100),
  address: z.string().max(300).optional(),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
  amenities: z.array(z.string().min(1)).default([]),
  businessLicenseUrl: z.string().url().optional().or(z.literal("")),
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

export const bookingSchema = z
  .discriminatedUnion("type", [
    guideBookingSchema,
    hotelBookingSchema,
    vehicleBookingSchema,
  ])
  .refine((data) => data.endDate > data.startDate, {
    message: "endDate must be after startDate",
    path: ["endDate"],
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
