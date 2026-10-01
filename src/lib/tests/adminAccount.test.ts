/**
 * The rules behind "change your password and sign-in address".
 *
 * What the schema will accept, tested without a database or a network. These
 * are the kind of rule that is easy to weaken by accident later and silent
 * when it is.
 *
 * Session revocation on a password change used to be tested here too, back
 * when sessions were our own JWTs and we had to refuse the stale ones
 * ourselves. Supabase Auth owns that now, so there is no predicate of ours
 * left to test — only Supabase's behaviour, which belongs in an end-to-end run
 * against a real project rather than here.
 *
 *   npm run test:admin:account
 */
import { adminAccountSchema, strongPasswordSchema } from "@/lib/validation";

let failures = 0;
let total = 0;

function check(name: string, passed: boolean, detail?: string) {
  total++;
  console.log(`${passed ? "PASS" : "FAIL"}  ${name}${passed || !detail ? "" : ` — ${detail}`}`);
  if (!passed) failures++;
}

function accepts(password: string) {
  return strongPasswordSchema.safeParse(password).success;
}

// ── the password rules ────────────────────────────────────────────────────
check(
  "rejects the seed default this feature exists to replace",
  !accepts("password123"),
  "twelve characters, but only lower case and digits"
);
check("rejects anything under ten characters", !accepts("Ab1@efgh"));
check("rejects a long single-class password", !accepts("aaaaaaaaaaaaaaaa"));
check("rejects two classes however long", !accepts("bhutanbhutanbhutan1"));
check("accepts three of the four classes", accepts("Bhutan1907ab"));
check("accepts the password actually chosen", accepts("Bhutan@1907"));
check(
  "rejects past bcrypt's 72-byte ceiling rather than silently truncating",
  !accepts("A1@" + "b".repeat(70))
);

// ── the form as a whole ───────────────────────────────────────────────────
const EMAIL = "admin@dttbhutan.com";

check(
  "an address-only change needs no new password",
  adminAccountSchema.safeParse({ email: EMAIL, currentPassword: "whatever" }).success
);

check(
  "an address-only change is not judged against the password rules",
  adminAccountSchema.safeParse({ email: EMAIL, currentPassword: "short" }).success,
  "currentPassword is checked against Supabase, not for strength"
);

check(
  "the current password is always required",
  !adminAccountSchema.safeParse({ email: EMAIL, newPassword: "Bhutan@1907" }).success
);

check(
  "a new password must be typed twice",
  !adminAccountSchema.safeParse({
    email: EMAIL,
    currentPassword: "old",
    newPassword: "Bhutan@1907",
    confirmPassword: "Bhutan@1908",
  }).success
);

check(
  "a matching pair is accepted",
  adminAccountSchema.safeParse({
    email: EMAIL,
    currentPassword: "old",
    newPassword: "Bhutan@1907",
    confirmPassword: "Bhutan@1907",
  }).success
);

check(
  "setting the password to the one already in use is refused",
  !adminAccountSchema.safeParse({
    email: EMAIL,
    currentPassword: "Bhutan@1907",
    newPassword: "Bhutan@1907",
    confirmPassword: "Bhutan@1907",
  }).success
);

check(
  "a malformed address is refused",
  !adminAccountSchema.safeParse({ email: "admin@", currentPassword: "old" }).success
);

console.log(
  failures === 0
    ? `\n${total}/${total} checks passed`
    : `\n${failures} of ${total} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
