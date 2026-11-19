import { z } from "zod";
import { COUNTRIES } from "@/lib/countries";
import { MAX_ADULTS_PER_ROOM, MAX_BEDS_PER_ROOM, MAX_ROOMS } from "@/lib/guestRooms";

/**
 * What a traveler tells us when booking a scheduled departure (step 2). One
 * schema serves the form and the server, so a rule can't be enforced in one
 * place and forgotten in the other.
 *
 * Passport numbers are not collected here: only what is needed to hold a
 * place. Add them later if the visa process needs them at booking.
 */

// Built from a string: the `u` flag on a literal needs a newer compile target than this project sets.
const NAME = new RegExp("^[\\p{L}][\\p{L}\\p{M} .'’-]*$", "u");
const PHONE = /^\+?[\d][\d\s().-]{5,24}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Whole years between a YYYY-MM-DD birth date and `today` (UTC date parts). */
export function ageOn(dob: string, today: Date = new Date()): number {
  const y = +dob.slice(0, 4);
  const m = +dob.slice(5, 7);
  const d = +dob.slice(8, 10);
  let age = today.getUTCFullYear() - y;
  const beforeBirthday = today.getUTCMonth() + 1 < m || (today.getUTCMonth() + 1 === m && today.getUTCDate() < d);
  if (beforeBirthday) age--;
  return age;
}

function isRealDate(iso: string): boolean {
  if (!ISO_DATE.test(iso)) return false;
  const d = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === iso;
}

const name = (label: string) =>
  z
    .string()
    .trim()
    .min(1, `${label} is required`)
    .max(60, `${label} is too long`)
    .regex(NAME, `${label} can only use letters, spaces, hyphens and apostrophes`);

const optionalText = (max: number, label: string) => z.string().trim().max(max, `${label} is too long`).optional().default("");

export const travelerSchema = z.object({
  firstName: name("First name"),
  lastName: name("Last name"),
  dateOfBirth: z
    .string()
    .refine(isRealDate, "Enter a valid date of birth")
    .refine((v) => !isRealDate(v) || ageOn(v) >= 18, "Adult travelers must be 18 or over")
    .refine((v) => !isRealDate(v) || ageOn(v) <= 110, "Enter a valid date of birth"),
  nationality: z.string().refine((v) => COUNTRIES.includes(v), "Choose a nationality"),
  gender: z.enum(["", "F", "M", "X"]).optional().default(""),
  dietary: optionalText(200, "Dietary requirements"),
});

export const roomLayoutSchema = z.object({
  adults: z.number().int().min(1).max(MAX_ADULTS_PER_ROOM),
  beds: z.number().int().min(1).max(MAX_BEDS_PER_ROOM),
});

export const travelerDetailsSchema = z
  .object({
    rooms: z.array(roomLayoutSchema).min(1).max(MAX_ROOMS),
    travelers: z.array(travelerSchema).min(1).max(30),
    contact: z.object({
      email: z.string().trim().email("Enter a valid email address").max(200),
      phone: z.string().trim().regex(PHONE, "Enter a phone or WhatsApp number, with country code"),
    }),
    emergency: z
      .object({
        name: z.string().trim().max(100, "Name is too long").default(""),
        phone: z.string().trim().max(25).default(""),
      })
      // Checked here, on the object itself, so the message appears together with
      // the others instead of only once every other field is correct.
      .superRefine((e, ctx) => {
        if (!e.name && !e.phone) return;
        if (!e.name) ctx.addIssue({ code: "custom", path: ["name"], message: "Add the emergency contact's name" });
        if (!PHONE.test(e.phone)) ctx.addIssue({ code: "custom", path: ["phone"], message: "Add the emergency contact's phone number" });
      })
      .optional(),
    requests: optionalText(1000, "Your note"),
    acceptedTerms: z.literal(true, { message: "Please accept the terms to continue" }),
  })
  .superRefine((d, ctx) => {
    const adults = d.rooms.reduce((n, r) => n + r.adults, 0);
    if (d.travelers.length !== adults) {
      ctx.addIssue({ code: "custom", path: ["travelers"], message: "The travelers don't match the rooms" });
    }
  });

export type TravelerDetails = z.infer<typeof travelerDetailsSchema>;
export type TravelerInput = z.input<typeof travelerSchema>;

/** The form's own shape: everything a string, nothing parsed yet. */
export type TravelerDraft = {
  travelers: { firstName: string; lastName: string; dateOfBirth: string; nationality: string; gender: string; dietary: string }[];
  email: string;
  phone: string;
  emergencyName: string;
  emergencyPhone: string;
  requests: string;
  acceptedTerms: boolean;
};

export const blankTraveler = () => ({ firstName: "", lastName: "", dateOfBirth: "", nationality: "", gender: "", dietary: "" });

export const blankDraft = (travelerCount: number): TravelerDraft => ({
  travelers: Array.from({ length: travelerCount }, blankTraveler),
  email: "",
  phone: "",
  emergencyName: "",
  emergencyPhone: "",
  requests: "",
  acceptedTerms: false,
});

/** Keeps what has been typed when the party size changes: extra rows are cut off the end, new ones added blank. */
export function resizeTravelers(draft: TravelerDraft, count: number): TravelerDraft {
  if (draft.travelers.length === count) return draft;
  const travelers = draft.travelers.slice(0, count);
  while (travelers.length < count) travelers.push(blankTraveler());
  return { ...draft, travelers };
}

export function draftToDetails(draft: TravelerDraft, rooms: { adults: number; beds: number }[]) {
  return {
    rooms: rooms.map((r) => ({ adults: r.adults, beds: r.beds })),
    travelers: draft.travelers,
    contact: { email: draft.email, phone: draft.phone },
    emergency: draft.emergencyName || draft.emergencyPhone ? { name: draft.emergencyName, phone: draft.emergencyPhone } : undefined,
    requests: draft.requests,
    acceptedTerms: draft.acceptedTerms as true,
  };
}

/** Field-by-field messages for the form, keyed like "travelers.0.firstName"; empty when valid. */
export function validateDraft(draft: TravelerDraft, rooms: { adults: number; beds: number }[]): Record<string, string> {
  const result = travelerDetailsSchema.safeParse(draftToDetails(draft, rooms));
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join(".");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

/** Why the details cannot belong to this party, or null when they fit. */
export function detailsMismatch(details: TravelerDetails, travelers: number, rooms?: number): string | null {
  if (details.travelers.length !== travelers) return "The traveler details don't match the number of travelers.";
  if (rooms !== undefined && details.rooms.length !== rooms) return "The traveler details don't match the number of rooms.";
  return null;
}

/** Which room (1-based) each traveler is in, in order. */
export function roomOfTraveler(rooms: { adults: number }[]): number[] {
  return rooms.flatMap((r, i) => Array.from({ length: r.adults }, () => i + 1));
}
