import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  phone: z.string().max(30).optional(),
  // No GUIDE: guides apply first (guideApplicationSchema) and only get a
  // login once an admin approves them.
  role: z.enum(["TRAVELER", "HOTEL_OPERATOR", "TRANSPORT_OPERATOR"]),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

/**
 * What an admin may change about their own sign-in.
 *
 * `currentPassword` is required for either change, not just the password one:
 * moving the account to a new address is as good as taking it over, so an
 * unattended logged-in browser should not be enough to do it.
 *
 * The password rules are deliberately about shape rather than length alone.
 * The account this was written for was live on "password123" — twelve
 * characters, which a bare minimum-length rule would wave through — so a
 * password must also draw on three of the four kinds of character. That
 * rejects the long-but-obvious ones without demanding anything unmemorable.
 */
const CHARACTER_CLASSES = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/];

export const strongPasswordSchema = z
  .string()
  // bcrypt only reads the first 72 bytes, so anything longer is a silent lie
  // about how strong the password is.
  .min(10, "Use at least 10 characters")
  .max(72, "Use at most 72 characters")
  .refine(
    (value) => CHARACTER_CLASSES.filter((re) => re.test(value)).length >= 3,
    "Use at least three of: lower case, upper case, numbers, symbols"
  );

export const adminAccountSchema = z
  .object({
    email: z.string().email("Enter a valid email address").max(200),
    currentPassword: z.string().min(1, "Enter your current password"),
    /** Omitted or empty when only the address is changing. */
    newPassword: strongPasswordSchema.optional(),
    confirmPassword: z.string().optional(),
  })
  .refine((data) => !data.newPassword || data.newPassword === data.confirmPassword, {
    message: "The two new passwords do not match",
    path: ["confirmPassword"],
  })
  .refine((data) => !data.newPassword || data.newPassword !== data.currentPassword, {
    message: "The new password is the same as the current one",
    path: ["newPassword"],
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

/**
 * A tour guide's application: who they are and the listing they want. There is
 * no password — no account exists until an admin approves the application.
 */
export const guideApplicationSchema = z.object({
  name: z.string().trim().min(2, "Please enter your full name").max(100),
  email: z
    .string()
    .trim()
    .email("That doesn't look like an email address")
    .max(200),
  phone: z.string().trim().min(6, "Please enter a phone or WhatsApp number").max(30),
  licenseNumber: z.string().trim().min(3, "Please enter your TCB licence number").max(50),
  languages: z.array(z.string().trim().min(1).max(60)).min(1, "Add at least one language").max(20),
  specialties: z.array(z.string().trim().min(1).max(60)).min(1, "Add at least one specialty").max(20),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  ratePerDay: z.coerce.number().positive("Enter your rate per day").max(1_000_000),
  bio: z.string().trim().max(2000).optional(),
  // An uploaded photo: a web address, or a site path in local development.
  photoUrl: z
    .string()
    .max(500)
    .refine((v) => v === "" || /^https?:\/\//.test(v) || v.startsWith("/"), "Photo link isn't valid")
    .optional(),
  destinationIds: z.array(z.string().min(1)).max(40).default([]),
  /** Hidden field real visitors leave empty; bots fill it in. */
  website: z.string().max(200).optional(),
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
  cabinClass: z.enum(["ECONOMY", "BUSINESS"]),
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

/** Blank number inputs arrive as "" — treat those as "not recorded". */
const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().optional()
);

export const itineraryLodgingInputSchema = z.object({
  name: z.string().min(1).max(150),
  location: z.string().max(150).optional(),
  description: z.string().max(2000).optional(),
  photoUrl: z.string().max(500).optional(),
});

export const itineraryPhotoInputSchema = z.object({
  url: z.string().min(1).max(500),
  caption: z.string().max(200).optional(),
});

export const itineraryDayInputSchema = z.object({
  dayNumber: z.coerce.number().int().min(1),
  title: z.string().min(1).max(150),
  description: z.string().max(2000).optional(),
  destinationId: z.string().min(1).optional().or(z.literal("")),
  activities: z.array(z.string().min(1)).default([]),
  mealsIncluded: z.array(z.string().min(1)).default([]),
  /**
   * Which lodging this night uses, as an index into the itinerary's
   * `lodgings` array rather than an id: the edit route replaces days and
   * lodgings together, so no id exists yet at the time the form is sent.
   */
  lodgingIndex: optionalNumber.pipe(z.number().int().min(0).optional()),
  hikeDistanceKm: optionalNumber.pipe(z.number().min(0).max(999).optional()),
  hikeAscentM: optionalNumber.pipe(z.number().int().min(0).max(9999).optional()),
  hikeDescentM: optionalNumber.pipe(z.number().int().min(0).max(9999).optional()),
  hikeHours: optionalNumber.pipe(z.number().min(0).max(24).optional()),
  hikeDifficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]).optional().or(z.literal("")),
  hikeNote: z.string().max(200).optional(),
});

export const itineraryAdminSchema = z.object({
  title: z.string().min(2).max(150),
  slug: z
    .string()
    .min(2)
    .max(150)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, numbers, and hyphens only"),
  summary: z.string().min(2).max(500),
  metaDescription: z.string().trim().max(200).nullable().optional(),
  description: z.string().max(5000).optional(),
  durationDays: z.coerce.number().int().min(1).max(60),
  pricePerPerson: z.coerce.number().positive(),
  maxGroupSize: z.coerce.number().int().positive().optional(),
  difficulty: z.enum(["EASY", "MODERATE", "CHALLENGING"]),
  category: z.enum(["TREKKING", "CULTURAL", "WILDLIFE", "HONEYMOON"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]),
  // Nullable, not just optional: the PATCH route spreads the parsed object
  // straight into prisma.update, so an omitted key leaves the column alone.
  // Clearing a cover photo therefore has to send an explicit null.
  coverPhotoUrl: z.string().max(500).nullish(),
  includes: z.array(z.string().min(1)).default([]),
  excludes: z.array(z.string().min(1)).default([]),
  days: z.array(itineraryDayInputSchema).min(1),
  lodgings: z.array(itineraryLodgingInputSchema).max(60).default([]),
  photos: z.array(itineraryPhotoInputSchema).max(60).default([]),
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
  metaDescription: z.string().trim().max(200).nullish(),
  content: z.string().min(2).max(20000),
  // nullish, not optional: an edit that removes the cover has to be able to
  // clear the column, which an absent key would leave untouched.
  coverPhotoUrl: z.string().max(500).nullish(),
  photoUrls: z.array(z.string().min(1).max(500)).max(30).default([]),
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
  cabinClass: z.enum(["ECONOMY", "BUSINESS"]),
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

/**
 * Everything on a destination that shows up on the public site. Deliberately
 * excludes `slug`: it's already in circulation as /destinations/<slug>, in
 * sitemaps and in whatever anyone has bookmarked, so renaming it from an admin
 * form would silently 404 those. The admin route parses this `.partial()`, so
 * the older region-only PATCH from the inline select still validates.
 *
 * Nullable rather than merely optional on the clearable columns, for the same
 * reason as itineraryAdminSchema.coverPhotoUrl: the route spreads the parsed
 * object into prisma.update, where an absent key means "leave alone" — so
 * emptying a description or a photo has to send an explicit null.
 */
export const destinationAdminSchema = z.object({
  name: z.string().min(2).max(100),
  region: z.enum(["WEST", "CENTRAL", "EAST", "NORTH", "SOUTH"]),
  description: z.string().max(3000).nullish(),
  metaDescription: z.string().trim().max(200).nullish(),
  highlights: z.array(z.string().min(1).max(200)).max(40),
  photoUrl: z.string().max(500).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
});

/**
 * Admin edits to vendor listings.
 *
 * Separate from the registration schemas above (guideProfileSchema, hotelSchema,
 * vehicleSchema) on purpose. Those describe a sign-up form, where a blank
 * optional field just means "not supplied yet"; these describe editing a record
 * that already exists, where clearing a field has to actually empty the column —
 * so the optional strings are `.nullish()` and the forms send explicit nulls.
 * They also omit everything a vendor shouldn't have rewritten from this screen:
 * the owning user, and `status`/`adminNote`, which stay with the approval
 * controls and vendorStatusUpdateSchema.
 *
 * These exist because vendor listings were create-only: the public /guides and
 * /hotels pages, and the homepage guide spotlight, showed whatever was entered
 * at registration with no way for anyone to correct it afterwards.
 */
export const guideAdminDetailsSchema = z.object({
  licenseNumber: z.string().min(3).max(50),
  languages: z.array(z.string().min(1).max(60)).min(1).max(20),
  specialties: z.array(z.string().min(1).max(60)).min(1).max(20),
  yearsExperience: z.coerce.number().int().min(0).max(60),
  ratePerDay: z.coerce.number().positive(),
  bio: z.string().max(2000).nullish(),
  metaDescription: z.string().trim().max(200).nullish(),
  photoUrl: z.string().max(500).nullish(),
  /** Replaces the guide's dzongkhag coverage wholesale — see the `set` in the
   * route, which is why this is required rather than nullish. */
  destinationIds: z.array(z.string().min(1)).max(20),
});

export const hotelAdminDetailsSchema = z.object({
  name: z.string().min(2).max(150),
  description: z.string().max(3000).nullish(),
  metaDescription: z.string().trim().max(200).nullish(),
  destinationId: z.string().min(1),
  address: z.string().max(300).nullish(),
  latitude: z.number().min(-90).max(90).nullish(),
  longitude: z.number().min(-180).max(180).nullish(),
  amenities: z.array(z.string().min(1).max(60)).max(40),
  photoUrls: z.array(z.string().min(1).max(500)).max(30),
});

export const vehicleAdminDetailsSchema = z.object({
  type: z.enum(["SEDAN", "SUV", "VAN", "BUS"]),
  capacity: z.coerce.number().int().positive().max(80),
  plateNumber: z.string().min(2).max(20),
  driverName: z.string().min(2).max(100),
  driverLicenseNumber: z.string().min(2).max(50),
  ratePerDay: z.coerce.number().positive(),
  ratePerKm: z.number().positive().nullish(),
  metaDescription: z.string().trim().max(200).nullish(),
  photoUrls: z.array(z.string().min(1).max(500)).max(20).default([]),
});

/**
 * Admin edits to DRUKA's knowledge base.
 *
 * `sourceType` is deliberately narrowed to the hand-authored kinds. ARTICLE,
 * PACKAGE and DESTINATION documents are machine-written copies of rows the
 * website already renders from (see src/lib/ai/siteKnowledge.ts) and are
 * replaced wholesale on every sync — editing one by hand would look like it
 * worked and then silently revert, so the dashboard doesn't offer it.
 *
 * `category` is `.nullish()` rather than optional for the same reason as
 * destinationAdminSchema: clearing it has to send an explicit null, because
 * the route hands the parsed object to an update that treats an absent key as
 * "leave this column alone".
 *
 * The content ceiling matches MAX_DOCUMENT_CHARS in src/lib/ai/ingestion.ts, so
 * an over-long paste is refused by the form with a field error rather than
 * throwing DocumentTooLargeError halfway through the request.
 */
export const knowledgeAdminSchema = z.object({
  title: z.string().min(3).max(200),
  content: z.string().min(20).max(200_000),
  sourceType: z.enum(["MANUAL", "FAQ", "POLICY", "UPLOAD"]),
  category: z.string().max(80).nullish(),
  visibility: z.enum(["PUBLIC", "INTERNAL"]),
  status: z.enum(["DRAFT", "PUBLISHED"]),
});

/**
 * Who a guide or hotel listing belongs to when an admin adds it directly,
 * rather than the vendor signing up. Email and phone are optional: plenty of
 * local guides and homestays are reached by phone, and a blank email simply
 * means the listing is managed by the agency (see vendorAccountFor).
 */
export const vendorContactSchema = z.object({
  name: z.string().trim().min(2, "Please enter a name").max(100),
  email: z
    .string()
    .trim()
    .email("That doesn't look like an email address")
    .max(200)
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export const adminGuideCreateSchema = z.object({
  contact: vendorContactSchema,
  guide: guideAdminDetailsSchema,
});

export const adminHotelCreateSchema = z.object({
  contact: vendorContactSchema,
  hotel: hotelAdminDetailsSchema,
  roomType: roomTypeSchema,
});
