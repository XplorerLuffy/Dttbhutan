import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { AuthError, requireRole } from "@/lib/auth";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { adminAccountSchema } from "@/lib/validation";
import { isAccountChangeRateLimited } from "@/lib/accountRateLimit";

/**
 * Lets an admin change their own sign-in address and password.
 *
 * Only their own: there is no `userId` in the body and none is accepted, so
 * this cannot be turned into "an admin edits anyone's credentials" by a
 * crafted request. The account changed is always the one holding the session,
 * and the Supabase calls below act as that session rather than as the service
 * role, so they could not reach another account even if one were named.
 *
 * The current password is required for both changes. Without it an unattended
 * logged-in browser is enough to move the account to an attacker's address and
 * then use the normal forgotten-password route from there. Supabase has no
 * "verify this password" call, so it is checked by signing in with it — which
 * is also what proves it is still the password Supabase holds, rather than one
 * our own table remembers.
 */
export async function PUT(req: NextRequest) {
  let admin;
  try {
    admin = await requireRole("ADMIN");
  } catch (err) {
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    throw err;
  }

  // Keyed by account, not by IP: this endpoint's risk is someone guessing the
  // current password of the session they are sitting in front of, and an IP
  // limit would be both evaded by a proxy and shared by a whole office.
  if (isAccountChangeRateLimited(admin.id)) {
    return NextResponse.json(
      { error: "Too many attempts. Wait a minute and try again." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = adminAccountSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { currentPassword, newPassword } = parsed.data;
  // Addresses are compared and stored lower-cased: our column is unique and
  // case-sensitive, so without this "Admin@…" and "admin@…" are two accounts
  // and whichever was typed at sign-up is the only one that can sign in.
  const email = parsed.data.email.trim().toLowerCase();

  if (!admin.authId) {
    // Only reachable if the import script has not run for this account. Better
    // a clear refusal than changing our row and leaving Supabase behind.
    return NextResponse.json(
      { error: "This account is not linked to Supabase Auth yet." },
      { status: 409 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { error: wrongPassword } = await supabase.auth.signInWithPassword({
    email: admin.email,
    password: currentPassword,
  });
  if (wrongPassword) {
    return NextResponse.json({ error: "That is not the current password." }, { status: 403 });
  }

  const emailChanged = email !== admin.email.toLowerCase();
  if (!emailChanged && !newPassword) {
    return NextResponse.json({ error: "Nothing to change." }, { status: 400 });
  }

  // Our own table first. It has the unique constraint that can actually say
  // "someone else already uses that address", and a failure here leaves
  // Supabase untouched — whereas the other order could change the sign-in
  // address in Supabase and then fail to record it, locking the admin out.
  try {
    await prisma.user.update({
      where: { id: admin.id },
      data: {
        ...(emailChanged ? { email } : {}),
        ...(newPassword ? { passwordChangedAt: new Date() } : {}),
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "Another account already uses that email address." },
        { status: 409 }
      );
    }
    throw err;
  }

  // The address goes through the admin client, not the session one. A project
  // with "Confirm email change" on — Supabase's default — treats
  // `updateUser({ email })` as a *request*: it emails both addresses and
  // leaves the old one in place until someone clicks through. Our row would
  // already say the new address, so the admin would be left signing in with an
  // address Supabase has never heard of. Setting it as the service role with
  // email_confirm applies it at once, which is also what register does, for
  // the same reason: there is no confirmation-email flow in this project yet.
  //
  // The password goes through the session client, so it is the signed-in
  // admin changing their own, and this browser keeps working afterwards.
  const authAdmin = createSupabaseAdminClient();
  const { error: updateError } = emailChanged
    ? await authAdmin.auth.admin.updateUserById(admin.authId!, { email, email_confirm: true })
    : { error: null };

  const { error: passwordError } = newPassword
    ? await supabase.auth.updateUser({ password: newPassword })
    : { error: null };

  if (updateError || passwordError) {
    // Put our row back, so the address an admin signs in with is never one
    // Supabase does not know about.
    await prisma.user.update({ where: { id: admin.id }, data: { email: admin.email } });
    return NextResponse.json(
      { error: "Supabase would not accept that change. Nothing was changed." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    email,
    emailChanged,
    passwordChanged: Boolean(newPassword),
  });
}
