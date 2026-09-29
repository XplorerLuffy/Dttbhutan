import "server-only";

/**
 * Google's Generative Language API accepts two different kinds of credential
 * on the same `?key=` parameter, and tells them apart by shape:
 *
 *   - `AIza…`  — an API key from Google AI Studio. Long-lived; this is what a
 *                deployment wants. A wrong one fails 400 "API key not valid".
 *   - `AQ.Ab…` — an OAuth 2 access token. Verified against the live API: a
 *                string of this shape is read as a bearer token regardless of
 *                how it's sent, and an invalid or expired one fails 401
 *                UNAUTHENTICATED "Expected OAuth 2 access token".
 *
 * The second kind is easy to pick up by mistake — it's what several Google
 * surfaces hand you — and it works, for about an hour. Then the assistant
 * starts answering "temporarily unavailable" with nothing in the logs but a
 * 401, which reads like a revoked key rather than an expired token, and the
 * fix (issue a fresh one) is not the fix that lasts.
 *
 * So the shape is checked at construction, where the message can name the
 * problem and the remedy, instead of surfacing an hour later as a 401. Shape
 * only — this never validates the credential itself, and never logs it.
 */
export function describeUnusableGeminiKey(apiKey: string): string | null {
  if (apiKey.startsWith("AQ.")) {
    return (
      'GEMINI_API_KEY looks like a short-lived OAuth access token (it starts "AQ."), ' +
      "not an API key. Tokens of that shape expire about an hour after they are issued, " +
      "so the assistant would work briefly and then fail with HTTP 401. Create an API " +
      "key at https://aistudio.google.com/apikey — it starts \"AIza\" and does not expire " +
      "— and set that instead."
    );
  }
  return null;
}
