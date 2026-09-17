import "server-only";
import { prisma } from "@/lib/prisma";
import { agencyInbox, sendEmails, type EmailMessage } from "@/lib/email/send";
import {
  bookingCancelledToVendor,
  bookingReceivedToTraveler,
  bookingStatusToTraveler,
  contactReceivedToSender,
  contactToAgency,
  customTourReceivedToTraveler,
  customTourToAgency,
  formatBTN,
  formatDateRange,
  newBookingToAgency,
  newBookingToVendor,
  vendorStatusToVendor,
  type RenderedEmail,
} from "@/lib/email/templates";

/**
 * Turns a domain event into the emails it should produce.
 *
 * Callers invoke these *after* their database write has committed — never
 * inside a transaction, where a slow SMTP round trip would hold locks open
 * and a provider outage could roll back a real booking.
 *
 * Every function here swallows its own errors (see `dispatch`): a booking
 * that succeeded must still look like a success to the traveler even if the
 * confirmation email can't go out.
 */

async function dispatch(messages: (EmailMessage | null)[]): Promise<void> {
  const real = messages.filter((m): m is EmailMessage => m !== null);
  if (real.length === 0) return;

  try {
    await sendEmails(real);
  } catch (err) {
    // sendEmail already swallows per-message failures; this is belt-and-braces
    // so a notification can never surface as a failed booking.
    console.error("[email] dispatch failed", err);
  }
}

function to(address: string | null | undefined, rendered: RenderedEmail, replyTo?: string): EmailMessage | null {
  if (!address) return null;
  return { to: address, ...rendered, ...(replyTo ? { replyTo } : {}) };
}

type BookingWithParties = NonNullable<Awaited<ReturnType<typeof loadBooking>>>;

function loadBooking(bookingId: string) {
  return prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      traveler: true,
      guide: { include: { user: true } },
      roomType: { include: { hotel: { include: { owner: true } } } },
      vehicle: { include: { operator: { include: { owner: true } } } },
      itineraryBooking: { include: { itinerary: true } },
      flightBooking: true,
    },
  });
}

/**
 * What the traveler actually bought, and who (if anyone) supplies it.
 * Package tours and flights have no vendor to notify — the agency and the
 * airline aggregator handle those respectively.
 */
function describeBooking(booking: BookingWithParties): {
  what: string;
  vendorEmail: string | null;
} {
  if (booking.guide) {
    return {
      what: `Guide: ${booking.guide.user.name}`,
      vendorEmail: booking.guide.user.email,
    };
  }
  if (booking.roomType) {
    return {
      what: `${booking.roomType.name} at ${booking.roomType.hotel.name}`,
      vendorEmail: booking.roomType.hotel.owner.email,
    };
  }
  if (booking.vehicle) {
    return {
      what: `${booking.vehicle.type} (${booking.vehicle.plateNumber}) from ${booking.vehicle.operator.businessName}`,
      vendorEmail: booking.vehicle.operator.owner.email,
    };
  }
  if (booking.itineraryBooking) {
    return { what: booking.itineraryBooking.itinerary.title, vendorEmail: null };
  }
  if (booking.flightBooking) {
    const f = booking.flightBooking;
    return {
      what: `Flight ${f.origin} → ${f.destination} (${f.airline} ${f.flightNumber})`,
      vendorEmail: null,
    };
  }
  return { what: "Booking", vendorEmail: null };
}

/** A traveler just made a booking: tell them, the vendor, and the agency. */
export async function notifyBookingCreated(bookingId: string): Promise<void> {
  const booking = await loadBooking(bookingId);
  if (!booking) return;

  const { what, vendorEmail } = describeBooking(booking);
  const dates = formatDateRange(booking.startDate, booking.endDate);
  const total = formatBTN(booking.totalPrice);
  const ref = booking.reference;

  await dispatch([
    to(
      booking.traveler.email,
      bookingReceivedToTraveler({
        travelerName: booking.traveler.name,
        reference: ref,
        what,
        dates,
        total,
        pending: booking.status === "PENDING",
      }),
      agencyInbox() ?? undefined
    ),
    vendorEmail
      ? to(
          vendorEmail,
          newBookingToVendor({
            reference: ref,
            what,
            dates,
            travelerName: booking.traveler.name,
            total,
          })
        )
      : null,
    to(
      agencyInbox(),
      newBookingToAgency({
        reference: ref,
        type: booking.type,
        what,
        dates,
        travelerName: booking.traveler.name,
        travelerEmail: booking.traveler.email,
        total,
        status: booking.status,
      }),
      booking.traveler.email
    ),
  ]);
}

/**
 * A booking was confirmed, cancelled or completed.
 *
 * The traveler always gets told. A cancellation additionally has to reach
 * the vendor — otherwise a guide turns up for a trip that isn't happening —
 * except when the vendor is the one who cancelled it.
 */
export async function notifyBookingStatusChanged(
  bookingId: string,
  status: "CONFIRMED" | "CANCELLED" | "COMPLETED",
  actorEmail?: string
): Promise<void> {
  const booking = await loadBooking(bookingId);
  if (!booking) return;

  const { what, vendorEmail } = describeBooking(booking);
  const dates = formatDateRange(booking.startDate, booking.endDate);
  const ref = booking.reference;

  const cancelledByVendor = status === "CANCELLED" && actorEmail === vendorEmail;

  await dispatch([
    to(
      booking.traveler.email,
      bookingStatusToTraveler({
        travelerName: booking.traveler.name,
        reference: ref,
        what,
        dates,
        status,
      }),
      agencyInbox() ?? undefined
    ),
    status === "CANCELLED" && vendorEmail && !cancelledByVendor
      ? to(
          vendorEmail,
          bookingCancelledToVendor({
            reference: ref,
            what,
            dates,
            travelerName: booking.traveler.name,
          })
        )
      : null,
    status === "CANCELLED"
      ? to(
          agencyInbox(),
          bookingCancelledToVendor({
            reference: ref,
            what,
            dates,
            travelerName: booking.traveler.name,
          }),
          booking.traveler.email
        )
      : null,
  ]);
}

/** A custom tour enquiry came in: acknowledge it and alert the agency. */
export async function notifyCustomTourRequested(requestId: string): Promise<void> {
  const request = await prisma.customTourRequest.findUnique({
    where: { id: requestId },
    include: { traveler: true, destinations: true },
  });
  if (!request) return;

  const destinations = request.destinations.map((d) => d.name).join(", ") || "Not specified";
  const dates = formatDateRange(request.startDate, request.endDate);
  const estimate = request.estimatedTotalPrice
    ? `${formatBTN(request.estimatedTotalPrice)} total${
        request.estimatedPricePerPerson ? ` (${formatBTN(request.estimatedPricePerPerson)}/person)` : ""
      }`
    : null;

  await dispatch([
    to(
      request.traveler.email,
      customTourReceivedToTraveler({
        travelerName: request.traveler.name,
        destinations,
        dates,
        travelers: request.travelers,
        estimate,
      }),
      agencyInbox() ?? undefined
    ),
    to(
      agencyInbox(),
      customTourToAgency({
        travelerName: request.traveler.name,
        travelerEmail: request.traveler.email,
        destinations,
        dates,
        travelers: request.travelers,
        budget: request.budgetPerPerson ? `${formatBTN(request.budgetPerPerson)}/person` : null,
        estimate,
        notes: request.notes,
      }),
      request.traveler.email
    ),
  ]);
}

/** Someone used the public contact form: acknowledge it and alert the agency. */
export async function notifyContactMessage(messageId: string): Promise<void> {
  const contact = await prisma.contactMessage.findUnique({
    where: { id: messageId },
    include: { traveler: { select: { email: true, role: true } } },
  });
  if (!contact) return;

  await dispatch([
    to(
      contact.email,
      contactReceivedToSender({
        name: contact.name,
        subject: contact.subject,
        message: contact.message,
      }),
      agencyInbox() ?? undefined
    ),
    to(
      agencyInbox(),
      contactToAgency({
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        subject: contact.subject,
        message: contact.message,
        accountNote: contact.traveler
          ? `Signed in as ${contact.traveler.email} (${contact.traveler.role})`
          : "Not signed in — no account",
      }),
      // Replying to the alert reaches the person who asked, not our own inbox.
      contact.email
    ),
  ]);
}

/** An admin approved, rejected or suspended a vendor listing: tell the vendor. */
export async function notifyVendorStatusChanged(input: {
  email: string;
  listingName: string;
  status: "APPROVED" | "REJECTED" | "SUSPENDED" | "PENDING";
  adminNote?: string | null;
}): Promise<void> {
  await dispatch([
    to(
      input.email,
      vendorStatusToVendor({
        listingName: input.listingName,
        status: input.status,
        adminNote: input.adminNote ?? null,
      }),
      agencyInbox() ?? undefined
    ),
  ]);
}
