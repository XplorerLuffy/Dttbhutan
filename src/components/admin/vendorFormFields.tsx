"use client";

/** Shared bits for the three vendor edit forms (guide, hotel, vehicle), which
 * all take the same shape: a grid of labelled inputs, comma-separated lists for
 * the String[] columns, and blanks that must clear a column rather than be
 * ignored. */

export function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      {children}
      {help && <p className="mt-1 text-xs text-stone-500">{help}</p>}
    </div>
  );
}

/** Matches the comma-separated convention already used for an itinerary's
 * includes/excludes, so the two admin surfaces behave the same way. */
export function splitList(value: string): string[] {
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** One per line — for photo URLs, which can legitimately contain commas in a
 * query string and would be torn in half by splitList. */
export function splitLines(value: string): string[] {
  return value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** The routes spread parsed data into prisma.update, where an absent key means
 * "leave this column alone" — so an emptied field has to send null to clear. */
export function nullableText(value: string): string | null {
  return value.trim() || null;
}

export function nullableNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Zod's flatten() puts whole-object problems in formErrors and per-field ones
 * in fieldErrors; the routes also return a plain string for the unique-conflict
 * cases. Shows whichever is present rather than a bare "went wrong". */
export function readError(data: {
  error?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> } | string;
}): string {
  if (typeof data.error === "string") return data.error;
  const form = data.error?.formErrors?.[0];
  if (form) return form;
  const fields = data.error?.fieldErrors ?? {};
  for (const [key, messages] of Object.entries(fields)) {
    if (messages?.[0]) return `${key}: ${messages[0]}`;
  }
  return "Something went wrong";
}
