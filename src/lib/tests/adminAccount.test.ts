/**
 * The rules behind "change your password and sign-in address".
 *
 * Two things worth testing without a database: what the schema will accept,
 * and whether an old session survives a password change. Both are the kind of
 * rule that is easy to weaken by accident later and silent when it is.
 *
 *   npm run test:admin:account
 */
import { adminAccountSchema, strongPasswordSchema } from "@/lib/validation";
import { isSessionStale } from "@/lib/auth";

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
  "currentPassword is checked against the stored hash, not for strength"
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

// ── sessions outliving a password change ──────────────────────────────────
const noon = new Date("2026-10-01T12:00:00Z");
const atNoon = Math.floor(noon.getTime() / 1000);

check(
  "an account whose password never changed accepts any token",
  !isSessionStale(atNoon - 60 * 60 * 24 * 13, null)
);
check(
  // Two seconds, not one: one second is the slack the rule deliberately
  // allows, and is covered by its own check below.
  "a token from before the change is refused",
  isSessionStale(atNoon - 2, noon)
);
check(
  "a token from long before the change is refused",
  isSessionStale(atNoon - 60 * 60 * 24, noon)
);
check(
  "the token minted by the change itself survives it",
  !isSessionStale(atNoon, noon),
  "iat is whole seconds and rounds down, so this is the same instant"
);
check(
  "a token minted a second before the change survives, by design",
  !isSessionStale(atNoon - 1, noon),
  "iat rounds down, so this can be the same instant seen from the other side"
);
check("a token from after the change is fine", !isSessionStale(atNoon + 5, noon));

console.log(
  failures === 0
    ? `\n${total}/${total} checks passed`
    : `\n${failures} of ${total} checks failed`
);
process.exit(failures === 0 ? 0 : 1);
