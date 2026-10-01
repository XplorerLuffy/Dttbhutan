/**
 * Every branch of first-sign-in migration, with the database and Supabase
 * replaced by fakes that record what was asked of them.
 *
 *   npm run test:auth:migration
 */
import bcrypt from "bcryptjs";
import { migrateLegacyAccount, type MigrationDeps } from "@/lib/authMigration";

let failures = 0;
let total = 0;
function check(name: string, passed: boolean, detail?: string) {
  total++;
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${passed || !detail ? "" : ` — ${detail}`}`);
  if (!passed) failures++;
}

const HASH = bcrypt.hashSync("password123", 4);

function fake(over: Partial<MigrationDeps> & { profile?: Parameters<MigrationDeps["link"]>[0] | null } = {}) {
  const calls = { created: 0, deleted: [] as string[], linked: [] as string[] };
  const profile =
    "profile" in over
      ? over.profile
      : { id: "u1", name: "Agency Admin", authId: null as string | null, passwordHash: HASH };
  const deps: MigrationDeps = {
    findProfile: async () => (profile as never) ?? null,
    verify: (p, h) => bcrypt.compare(p, h),
    createAuthUser: async () => {
      calls.created++;
      return "auth-uuid-1";
    },
    deleteAuthUser: async (id) => {
      calls.deleted.push(id);
    },
    link: async (_p, a) => {
      calls.linked.push(a);
      return true;
    },
    configured: () => true,
    ...over,
  };
  return { deps, calls };
}

async function main() {
  {
    const { deps, calls } = fake();
    const r = await migrateLegacyAccount("admin@droelma.bt", "password123", deps);
    check("the right password migrates the account", r === "migrated", r);
    check("…creating exactly one Supabase user", calls.created === 1);
    check("…and linking it", calls.linked[0] === "auth-uuid-1");
    check("…and deleting nothing", calls.deleted.length === 0);
  }
  {
    const { deps, calls } = fake();
    const r = await migrateLegacyAccount("admin@droelma.bt", "wrong-guess", deps);
    check("a wrong password migrates nothing", r === "wrong-password", r);
    check("…and never touches Supabase", calls.created === 0);
  }
  {
    const { deps, calls } = fake({ profile: null as never });
    const r = await migrateLegacyAccount("nobody@example.com", "password123", deps);
    check("an unknown address creates nothing", r === "no-profile" && calls.created === 0, r);
  }
  {
    const { deps, calls } = fake({ profile: { id: "u1", name: "A", authId: "existing", passwordHash: HASH } as never });
    const r = await migrateLegacyAccount("admin@droelma.bt", "password123", deps);
    check("an already-linked account is left alone", r === "already-linked" && calls.created === 0, r);
  }
  {
    const { deps, calls } = fake({ profile: { id: "u1", name: "A", authId: null, passwordHash: null } as never });
    const r = await migrateLegacyAccount("admin@droelma.bt", "password123", deps);
    check("no legacy hash, no migration", r === "no-legacy-password" && calls.created === 0, r);
  }
  {
    const { deps, calls } = fake({ configured: () => false });
    const r = await migrateLegacyAccount("admin@droelma.bt", "password123", deps);
    check("without the service key it refuses rather than throwing", r === "not-configured" && calls.created === 0, r);
  }
  {
    const { deps, calls } = fake({ createAuthUser: async () => null });
    const r = await migrateLegacyAccount("admin@droelma.bt", "password123", deps);
    check("a failed create links nothing", r === "create-failed" && calls.linked.length === 0, r);
  }
  {
    const { deps, calls } = fake({ link: async () => false });
    const r = await migrateLegacyAccount("admin@droelma.bt", "password123", deps);
    check("losing the link race reports it", r === "link-failed", r);
    check("…and deletes the orphaned Supabase user", calls.deleted[0] === "auth-uuid-1");
  }
  {
    const { deps, calls } = fake({
      link: async () => {
        throw new Error("db down");
      },
    });
    let threw = false;
    try {
      await migrateLegacyAccount("admin@droelma.bt", "password123", deps);
    } catch {
      threw = true;
    }
    check("a database error while linking propagates", threw);
    check("…and still deletes the orphaned Supabase user", calls.deleted[0] === "auth-uuid-1");
  }

  console.log(failures === 0 ? `\n${total}/${total} checks passed` : `\n${failures} of ${total} checks failed`);
  process.exit(failures === 0 ? 0 : 1);
}
main();
