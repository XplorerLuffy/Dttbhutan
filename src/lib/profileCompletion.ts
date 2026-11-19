/**
 * How complete a traveler's profile is.
 *
 * Counted from the fields an account actually has today: name, email and phone.
 * (There is no photo, date of birth, passport, emergency contact or travel
 * preference on the account, and no page where a traveler could add them, so
 * none of those are counted. When they exist, add them to FIELDS and the
 * percentage follows.)
 *
 * Each field counts equally, and a field counts when it is not blank.
 */
export type ProfileFieldKey = "name" | "email" | "phone";

const FIELDS: { key: ProfileFieldKey; label: string }[] = [
  { key: "name", label: "Name" },
  { key: "email", label: "Email address" },
  { key: "phone", label: "Phone number" },
];

export type ProfileCompletion = {
  percent: number;
  filled: number;
  total: number;
  missing: string[];
  complete: boolean;
};

export function profileCompletion(user: { name?: string | null; email?: string | null; phone?: string | null }): ProfileCompletion {
  const done = FIELDS.filter((f) => Boolean(user[f.key]?.trim()));
  const missing = FIELDS.filter((f) => !done.includes(f)).map((f) => f.label);
  return {
    percent: Math.round((done.length / FIELDS.length) * 100),
    filled: done.length,
    total: FIELDS.length,
    missing,
    complete: missing.length === 0,
  };
}
