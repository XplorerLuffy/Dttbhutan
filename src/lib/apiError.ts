/**
 * The message to show for a failed API call.
 *
 * Our routes answer a bad form in one of two shapes: a plain string, or zod's
 * `flatten()` — `{ formErrors: [], fieldErrors: { slug: ["..."] } }`. The forms
 * used to do `data.error?.formErrors?.[0] ?? data.error`, which falls through
 * to that whole object when the problem is in a field. Rendering an object as
 * React text throws, and the visitor gets "Application error: a client-side
 * exception has occurred" instead of being told which field to fix. This
 * always returns a string.
 */
export function apiErrorMessage(
  data: unknown,
  fallback = "Something went wrong",
): string {
  const error = (data as { error?: unknown } | null | undefined)?.error;
  if (typeof error === "string" && error) return error;
  if (error && typeof error === "object") {
    const { formErrors, fieldErrors } = error as {
      formErrors?: unknown;
      fieldErrors?: unknown;
    };
    if (Array.isArray(formErrors) && typeof formErrors[0] === "string")
      return formErrors[0];
    if (fieldErrors && typeof fieldErrors === "object") {
      for (const [field, messages] of Object.entries(
        fieldErrors as Record<string, unknown>,
      )) {
        if (Array.isArray(messages) && typeof messages[0] === "string") {
          return `${labelFor(field)}: ${messages[0]}`;
        }
      }
    }
  }
  return fallback;
}

function labelFor(field: string): string {
  const spaced = field.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
