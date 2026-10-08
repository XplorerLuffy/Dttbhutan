import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";
import { findInvite, hashInviteToken } from "@/lib/invite";
import { clientIp, createRateLimiter } from "@/lib/rateLimit";

/**
 * Turns an approved guide's emailed link into a login.
 *
 * The account in Supabase is created here, at the moment the guide chooses a
 * password — approving an application doesn't create one. The link is claimed
 * first, atomically, so two clicks can't both make an account; if Supabase
 * then refuses, the link is put back so the guide can try again.
 */
const limited = createRateLimiter({ windowMs: 10 * 60 * 1000, max: 10 });

const bodySchema = z.object({
  token: z.string().min(20).max(100),
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

const LINK_DEAD =
  "This link has expired or has already been used. Ask our team to send you a new one.";

export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    return NextResponse.json(
      { error: "Sign-in is not configured on this deployment (Supabase keys are missing)." },
      { status: 503 }
    );
  }
  if (limited(clientIp(req))) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Please check the form and try again." },
      { status: 400 }
    );
  }
  const { token, password } = parsed.data;

  const user = await findInvite(token);
  if (!user || user.authId) {
    return NextResponse.json({ error: LINK_DEAD }, { status: 400 });
  }

  // Claim the link. Only one request can change the row from "has this
  // token" to "has none".
  const claimed = await prisma.user.updateMany({
    where: { id: user.id, inviteTokenHash: hashInviteToken(token), authId: null },
    data: { inviteTokenHash: null, inviteExpiresAt: null },
  });
  if (claimed.count !== 1) {
    return NextResponse.json({ error: LINK_DEAD }, { status: 400 });
  }

  const restoreLink = () =>
    prisma.user.update({
      where: { id: user.id },
      data: { inviteTokenHash: hashInviteToken(token), inviteExpiresAt: user.inviteExpiresAt },
    });

  const admin = createSupabaseAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: user.email,
    password,
    email_confirm: true,
  });
  if (createError || !created.user) {
    await restoreLink();
    const alreadyThere = createError?.status === 422 || /already/i.test(createError?.message ?? "");
    return NextResponse.json(
      {
        error: alreadyThere
          ? "This email already has a login. Try logging in instead."
          : "Could not set up your login. Please try again.",
      },
      { status: alreadyThere ? 409 : 502 }
    );
  }

  try {
    await prisma.user.update({
      where: { id: user.id },
      data: { authId: created.user.id, passwordChangedAt: new Date() },
    });
  } catch (err) {
    // Don't leave a login that nothing in our database points at.
    await admin.auth.admin.deleteUser(created.user.id);
    await restoreLink();
    throw err;
  }

  // Signing in is what sets the session cookies; the admin client holds none.
  const supabase = await createSupabaseServerClient("public");
  await supabase.auth.signInWithPassword({ email: user.email, password });

  return NextResponse.json({ ok: true, role: user.role });
}
