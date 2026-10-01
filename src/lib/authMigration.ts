import "server-only";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

/**
 * Moves an account from the old bcrypt login to Supabase Auth the first time
 * its owner signs in.
 *
 * The switch to Supabase Auth went live with every existing account still
 * unlinked, so nobody could sign in — the batch import
 * (prisma/migrate-users-to-supabase-auth.ts) needs the service role key and
 * someone to run it. This makes the import unnecessary: when Supabase does not
 * know an address, the password is checked against the hash we already hold,
 * and only if it matches is a Supabase account created, with that same
 * password, and linked. Nobody resets anything; each account moves over the
 * moment the person who owns it proves it.
 *
 * It can only ever create an account for someone who just typed that
 * account's correct password, so it grants nothing the old login did not.
 *
 * Dependencies are injectable so the branching can be tested without a
 * database or a Supabase project — see src/lib/tests/authMigration.test.ts.
 */
export type MigrationOutcome =
  | "migrated"
  | "no-profile"
  | "already-linked"
  | "no-legacy-password"
  | "wrong-password"
  | "not-configured"
  | "create-failed"
  | "link-failed";

type Profile = { id: string; name: string; authId: string | null; passwordHash: string | null };

export type MigrationDeps = {
  findProfile(email: string): Promise<Profile | null>;
  verify(password: string, hash: string): Promise<boolean>;
  createAuthUser(input: { email: string; password: string; name: string }): Promise<string | null>;
  deleteAuthUser(id: string): Promise<void>;
  /** Links only if still unlinked, and reports whether it did. */
  link(profileId: string, authId: string): Promise<boolean>;
  configured(): boolean;
};

export const defaultMigrationDeps: MigrationDeps = {
  findProfile: (email) =>
    prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, name: true, authId: true, passwordHash: true },
    }),
  verify: (password, hash) => bcrypt.compare(password, hash),
  async createAuthUser({ email, password, name }) {
    const { data, error } = await createSupabaseAdminClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error) console.error("[auth-migration] createUser failed:", error.message);
    return data?.user?.id ?? null;
  },
  async deleteAuthUser(id) {
    await createSupabaseAdminClient().auth.admin.deleteUser(id);
  },
  async link(profileId, authId) {
    // Conditional on authId still being null, so two simultaneous first
    // sign-ins cannot link one profile twice.
    const { count } = await prisma.user.updateMany({
      where: { id: profileId, authId: null },
      data: { authId },
    });
    return count === 1;
  },
  configured: () => Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()),
};

export async function migrateLegacyAccount(
  email: string,
  password: string,
  deps: MigrationDeps = defaultMigrationDeps
): Promise<MigrationOutcome> {
  const profile = await deps.findProfile(email);
  if (!profile) return "no-profile";
  if (profile.authId) return "already-linked";
  if (!profile.passwordHash) return "no-legacy-password";

  // Checked before anything touches Supabase: a wrong guess must not create,
  // or even look up, anything.
  if (!(await deps.verify(password, profile.passwordHash))) return "wrong-password";

  if (!deps.configured()) {
    console.error(
      "[auth-migration] SUPABASE_SERVICE_ROLE_KEY is not set, so a correct legacy password could not be migrated."
    );
    return "not-configured";
  }

  const authId = await deps.createAuthUser({ email, password, name: profile.name });
  if (!authId) return "create-failed";

  let linked = false;
  try {
    linked = await deps.link(profile.id, authId);
  } finally {
    // An auth user nobody's profile points at cannot sign in (the login route
    // refuses it) and would block the address from migrating properly later.
    if (!linked) await deps.deleteAuthUser(authId).catch(() => {});
  }
  return linked ? "migrated" : "link-failed";
}
