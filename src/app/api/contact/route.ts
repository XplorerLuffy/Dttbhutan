import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { notifyContactMessage } from "@/lib/email/notify";

/**
 * Public contact form — deliberately unauthenticated, so someone can ask a
 * question before committing to an account.
 *
 * That openness is the whole point, and also the risk: this is the only
 * write endpoint on the site a stranger can hit. Hence the honeypot, the
 * per-IP rate limit, and length caps on every field.
 */

const contactSchema = z.object({
  name: z.string().trim().min(2, "Please tell us your name").max(100),
  email: z.string().trim().email("That doesn't look like an email address").max(200),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(150).optional().or(z.literal("")),
  message: z.string().trim().min(10, "Please add a little more detail").max(5000),
  /**
   * Hidden field: real people never fill this in, bots usually do.
   *
   * Deliberately NOT validated as empty here — rejecting it as a field error
   * would hand a bot a 400 naming "website", which is a map to the trap. It's
   * checked after parsing instead, and a tripped honeypot gets the same 201 a
   * real submission does.
   */
  website: z.string().max(200).optional(),
});

/**
 * In-memory rate limiting. Good enough to stop a naive script, and honest
 * about its limits: serverless instances don't share this map, so it's a
 * speed bump rather than a guarantee. Move to a shared store (or a WAF
 * rule) if the form ever attracts real abuse.
 */
const RATE_LIMIT = { windowMs: 10 * 60 * 1000, max: 5 };
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

  // Opportunistic cleanup so the map can't grow without bound.
  if (submissions.size > 5000) {
    submissions.forEach((times, k) => {
      if (times.every((t) => now - t >= RATE_LIMIT.windowMs)) submissions.delete(k);
    });
  }

  return false;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: "Too many messages from this connection. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { name, email, phone, subject, message, website } = parsed.data;

  // Honeypot tripped: accept the request so the bot doesn't learn anything,
  // but don't store or forward it.
  if (website) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  // Attach the account if they happen to be signed in — useful context for
  // staff, but never required.
  const user = await getCurrentUser().catch(() => null);

  const contact = await prisma.contactMessage.create({
    data: {
      name,
      email,
      phone: phone || null,
      subject: subject || null,
      message,
      travelerId: user?.id ?? null,
    },
  });

  await notifyContactMessage(contact.id);

  return NextResponse.json({ ok: true }, { status: 201 });
}
