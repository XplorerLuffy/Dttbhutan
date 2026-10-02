import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { absoluteUrl } from "@/lib/seo";
import { notifyItineraryRequested } from "@/lib/email/notify";
import type { SendResult } from "@/lib/email/send";

/**
 * "Download Itinerary" on a trip page: the visitor leaves an email (and,
 * optionally, the departure they're eyeing) and the itinerary is emailed to
 * them. It is deliberately not handed back to the page — the inbox is the
 * delivery, which is what makes the address worth something to the agency.
 *
 * Because the email is the only way they get it, the response says whether
 * it actually went out (`emailed`). When it didn't, the request is still
 * stored as an enquiry and the page tells them the team will send it by
 * hand, rather than promising an email that is never coming.
 *
 * Unauthenticated and stranger-reachable, like /api/contact — hence the same
 * honeypot, per-IP rate limit and length caps.
 */

const requestSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  email: z.string().trim().email("That doesn't look like an email address").max(200),
  departureId: z.string().trim().max(40).optional().or(z.literal("")),
  /** Hidden field — see the note on the same field in /api/contact. */
  website: z.string().max(200).optional(),
});

/** Same in-memory speed bump as /api/contact, and the same caveats: not shared
 * between serverless instances, gone on restart. */
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 8 };
const submissions = new Map<string, number[]>();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  const recent = (submissions.get(key) ?? []).filter((t) => now - t < RATE_LIMIT.windowMs);

  if (recent.length >= RATE_LIMIT.max) {
    submissions.set(key, recent);
    return true;
  }

  recent.push(now);
  submissions.set(key, recent);

  if (submissions.size > 5000) {
    submissions.forEach((times, k) => {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) submissions.delete(k);
    });
  }

  return false;
}

/** DATE columns are read back in UTC so a 4 October departure isn't the 3rd. */
function day(date: Date) {
  return format(new Date(`${date.toISOString().slice(0, 10)}T12:00:00`), "d MMM yyyy");
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many requests from this connection. Please try again later." },
      { status: 429 }
    );
  }

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { slug, email, website } = parsed.data;

  const trip = await prisma.itinerary.findUnique({
    where: { slug },
    select: { id: true, slug: true, title: true, status: true },
  });
  if (!trip || trip.status !== "PUBLISHED") {
    return NextResponse.json({ error: "That trip isn't available." }, { status: 404 });
  }

  // Only a departure of this trip counts; anything else — an edited id, one
  // that has since been removed — falls back to the general itinerary.
  const departure = parsed.data.departureId
    ? await prisma.departure.findFirst({
        where: { id: parsed.data.departureId, itineraryId: trip.id },
        select: { id: true, startDate: true, endDate: true },
      })
    : null;

  const pdfPath = `/packages/${trip.slug}/itinerary.pdf${departure ? `?departure=${departure.id}` : ""}`;

  // Honeypot tripped: same answer a person gets, nothing stored or sent.
  if (website) return NextResponse.json({ ok: true, emailed: true }, { status: 201 });

  const departureLabel = departure ? `${day(departure.startDate)} to ${day(departure.endDate)}` : null;

  let contactId: string;
  try {
    const user = await getCurrentUser().catch(() => null);
    const contact = await prisma.contactMessage.create({
      data: {
        // The form asks for an email only — fewer fields, more people finish
        // it. The admin list needs a name, and this says plainly where the
        // enquiry came from rather than inventing one.
        name: user?.name ?? "Itinerary download",
        email,
        subject: `Itinerary requested: ${trip.title}`,
        message: departureLabel
          ? `Downloaded the itinerary for ${trip.title} and picked the ${departureLabel} departure.`
          : `Downloaded the itinerary for ${trip.title} (no departure date chosen yet).`,
        travelerId: user?.id ?? null,
        departureId: departure?.id ?? null,
      },
    });
    contactId = contact.id;
  } catch (err) {
    // Not stored means nobody would follow up either, so this one is a real
    // failure for the visitor to retry.
    console.error("[itinerary-request] could not record the request", err);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again in a moment." },
      { status: 500 }
    );
  }

  const sent = await notifyItineraryRequested({
    messageId: contactId,
    tripTitle: trip.title,
    departure: departureLabel,
    pdfUrl: absoluteUrl(pdfPath),
    tripUrl: absoluteUrl(`/packages/${trip.slug}`),
  }).catch((err): SendResult => {
    console.error("[itinerary-request] could not email the itinerary", err);
    return { ok: false, error: "notify failed" };
  });

  return NextResponse.json({ ok: true, emailed: wasDelivered(sent) }, { status: 201 });
}

/**
 * Whether the traveller can expect the email. A send skipped for missing
 * configuration only counts off Vercel — locally the email is printed to the
 * console, which is the point of the skip; on a deployment it means nothing
 * reached them.
 */
function wasDelivered(result: SendResult): boolean {
  if (!result.ok) return false;
  if ("id" in result) return true;
  return !process.env.VERCEL;
}
