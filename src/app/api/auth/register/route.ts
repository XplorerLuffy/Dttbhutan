import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { registerSchema } from "@/lib/validation";

/**
 * Creates an account in Supabase Auth and the profile row that belongs to it.
 *
 * The auth user is made with the service-role client and `email_confirm: true`
 * because this project has no confirmation-email flow yet; the alternative is
 * an account that exists but cannot sign in, with nothing telling the person
 * why. Turn that off here when confirmation emails are wired up.
 *
 * The two writes cannot share a transaction — one is an HTTP call to Supabase,
 * the other a row in our database — so if the profile write fails the auth
 * user is deleted again. An auth user with no profile cannot sign in (the
 * login route refuses it), and leaving one behind would block the address
 * from ever being registered properly.
 */
export async function POST(req: NextRequest) {
  if (!isSupabaseAuthConfigured()) {
    // Says which half is missing rather than "Login failed", so a deploy with
    // the keys unset is diagnosable from the screen it fails on.
    return NextResponse.json(
      { error: "Sign-in is not configured on this deployment (Supabase keys are missing)." },
      { status: 503 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const { name, password, phone, role } = parsed.data;
  const email = parsed.data.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists" },
      { status: 409 }
    );
  }

  const admin = createSupabaseAdminClient();
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError || !created.user) {
    // Supabase knows the address even though we do not — the profile was
    // deleted, or the account was made outside the app.
    const alreadyThere = createError?.status === 422 || /already/i.test(createError?.message ?? "");
    return NextResponse.json(
      {
        error: alreadyThere
          ? "An account with this email already exists"
          : "Could not create that account. Please try again.",
      },
      { status: alreadyThere ? 409 : 502 }
    );
  }

  let user;
  try {
    user = await prisma.user.create({
      data: { name, email, authId: created.user.id, phone, role },
    });
  } catch (err) {
    await admin.auth.admin.deleteUser(created.user.id);
    throw err;
  }

  // Signing in through the normal client is what sets the session cookies;
  // the admin client above holds no session of its own.
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signInWithPassword({ email, password });

  return NextResponse.json({ id: user.id, role: user.role });
}
