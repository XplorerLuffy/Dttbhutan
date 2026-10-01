/**
 * Gives every existing profile a Supabase auth user, keeping its password.
 *
 * Supabase Auth hashes with bcrypt, which is what this project already used,
 * so the stored hash can be handed over as-is: nobody is forced to reset, and
 * everyone signs in afterwards with the password they already know.
 *
 * Idempotent, and safe to re-run. A row that already has an authId is skipped.
 * A row whose address Supabase already knows is linked to that auth user
 * rather than failing or creating a second one — which is what makes a partial
 * run recoverable by simply running it again.
 *
 *   SUPABASE_SERVICE_ROLE_KEY=... NEXT_PUBLIC_SUPABASE_URL=... \
 *     npx tsx prisma/migrate-users-to-supabase-auth.ts
 *
 * Pass --dry-run to see what it would do and change nothing.
 */
import { PrismaClient } from "@prisma/client";
import { createClient } from "@supabase/supabase-js";

const prisma = new PrismaClient();
const dryRun = process.argv.includes("--dry-run");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!url || !serviceKey) {
  console.error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Supabase has no "get user by email", so the page is walked once up front. */
async function existingAuthUsersByEmail(): Promise<Map<string, string>> {
  const byEmail = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    for (const u of data.users) if (u.email) byEmail.set(u.email.toLowerCase(), u.id);
    if (data.users.length < 1000) break;
  }
  return byEmail;
}

async function main() {
  const users = await prisma.user.findMany({ orderBy: { createdAt: "asc" } });
  const already = users.filter((u) => u.authId).length;
  console.log(
    `${users.length} profile(s); ${already} already linked, ${users.length - already} to do` +
      (dryRun ? "  (dry run)" : "")
  );

  const authByEmail = await existingAuthUsersByEmail();
  let created = 0;
  let linked = 0;
  let failed = 0;

  for (const user of users) {
    if (user.authId) continue;
    const email = user.email.toLowerCase();

    const existingId = authByEmail.get(email);
    if (existingId) {
      console.log(`  link    ${email}  → ${existingId}`);
      if (!dryRun) {
        await prisma.user.update({ where: { id: user.id }, data: { authId: existingId } });
      }
      linked++;
      continue;
    }

    if (!user.passwordHash) {
      // Nothing to carry over. Creating an account with a password nobody
      // knows would look migrated while being unusable, so leave it and say so.
      console.warn(`  SKIP    ${email}  — no password hash; create this one by hand`);
      failed++;
      continue;
    }

    console.log(`  create  ${email}  (${user.role})`);
    if (dryRun) {
      created++;
      continue;
    }

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password_hash: user.passwordHash,
      email_confirm: true,
      user_metadata: { name: user.name },
    });

    if (error || !data.user) {
      console.error(`  FAILED  ${email}  — ${error?.message ?? "no user returned"}`);
      failed++;
      continue;
    }

    await prisma.user.update({ where: { id: user.id }, data: { authId: data.user.id } });
    created++;
  }

  console.log(`\ncreated ${created}, linked ${linked}, failed ${failed}`);
  if (failed > 0) process.exitCode = 1;
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
