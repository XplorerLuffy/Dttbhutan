import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { absoluteUrl } from "@/lib/seo";
import { notifyItineraryRequested } from "@/lib/email/notify";

/**
 * "Download Itinerary" on a trip page: the visitor leaves an email (and,
 * optionally, the departure they're eyeing) and the agency's team emails the
 * itinerary to them personally. Nothing is sent to the visitor automatically,
 * and the PDF is not handed back to the page.
 *
 * The request is stored as an enquiry (Admin → Enquiries) and the agency
 * inbox is alerted. Storing it is what matters — the alert is a convenience,
 * so a failed alert never fails the request, but a failed save does.
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
  if (website) return NextResponse.json({ ok: true }, { status: 201 });

  const departureLabel = departure ? `${day(departure.startDate)} to ${day(departure.endDate)}` : null;

  try {
    const user = await getCurrentUser().catch(() => null);
    await prisma.contactMessage.create({
      data: {
        // The form asks for an email only — fewer fields, more people finish
        // it. The admin list needs a name, and this says plainly where the
        // enquiry came from rather than inventing one.
        name: user?.name ?? "Itinerary request",
        email,
        subject: `Itinerary requested: ${trip.title}`,
        message:
          (departureLabel
            ? `Asked for the itinerary for ${trip.title}, ${departureLabel} departure.`
            : `Asked for the itinerary for ${trip.title} (no departure date chosen yet).`) +
          ` Please email it to them — they were told our team would send it. PDF: ${absoluteUrl(pdfPath)}`,
        travelerId: user?.id ?? null,
        departureId: departure?.id ?? null,
      },
    });
  } catch (err) {
    // Not stored means nobody would follow up either, so this one is a real
    // failure for the visitor to retry.
    console.error("[itinerary-request] could not record the request", err);
    return NextResponse.json(
      { error: "Something went wrong on our side. Please try again in a moment." },
      { status: 500 }
    );
  }

  await notifyItineraryRequested({
    customerEmail: email,
    tripTitle: trip.title,
    departure: departureLabel,
    pdfUrl: absoluteUrl(pdfPath),
    tripUrl: absoluteUrl(`/packages/${trip.slug}`),
  }).catch((err) => console.error("[itinerary-request] could not alert the agency", err));

  return NextResponse.json({ ok: true }, { status: 201 });
}
