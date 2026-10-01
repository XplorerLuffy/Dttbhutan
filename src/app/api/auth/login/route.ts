import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient, isSupabaseAuthConfigured } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation";

/**
 * Signs in against Supabase Auth and hands back the role, which is what the
 * login page uses to decide which dashboard to open.
 *
 * Done here rather than from the browser so the response shape the login page
 * already expects is unchanged, and so the role comes from the profile row
 * rather than from anything the client could influence.
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
  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const email = parsed.data.email.trim().toLowerCase();

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  // One message for a wrong password and for an address with no account:
  // telling them apart turns the form into a way to find out who has an
  // account here.
  if (error || !data.user) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { authId: data.user.id } });
  if (!user) {
    // Credentials were right but there is no profile — the two stores have
    // drifted. Do not leave a usable session lying around for an account the
    // app cannot place.
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "That account is not set up yet. Please contact the team." },
      { status: 403 }
    );
  }

  return NextResponse.json({ id: user.id, role: user.role });
}
