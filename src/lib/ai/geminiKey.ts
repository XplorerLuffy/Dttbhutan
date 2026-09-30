import "server-only";

/**
 * Google's Generative Language API answers an unrecognised credential with
 *
 *   401 UNAUTHENTICATED — "Request had invalid authentication credentials.
 *   Expected OAuth 2 access token, login cookie or other valid authentication
 *   credential."
 *
 * which is actively misleading: it is what you get for a *deleted or revoked
 * API key*, not a sign that the endpoint wanted OAuth. Verified against the
 * live API — a revoked key and a bearer token produce the same 401, while a
 * merely malformed key produces 400 "API key not valid".
 *
 * Worth translating, because the message sends you looking for the wrong
 * thing. It cost this project a wrong diagnosis once already: the key format
 * changed (Google now issues keys prefixed "AQ." from AI Studio instead of the
 * older "AIza"), the two facts were read together, and the conclusion drawn
 * was that the new format was a short-lived OAuth token. It is not — an "AQ."
 * key authenticates and does not expire, confirmed against this same API. The
 * prefix says nothing about whether a key is valid, so nothing here inspects
 * it.
 */
export function explainGeminiStatus(status: number): string | null {
  if (status === 401) {
    return (
      " — Google returns this for a key it does not recognise, whatever the message says about " +
      "OAuth. Check GEMINI_API_KEY still exists at https://aistudio.google.com/apikey and was " +
      "copied whole; a regenerated key leaves the old one invalid. Both the AIza… and newer AQ.… " +
      "formats are valid API keys."
    );
  }
  if (status === 403) {
    return (
      " — the key is recognised but not permitted here. Check the Generative Language API is " +
      "enabled on its project and that no API/referrer restriction excludes this call."
    );
  }
  return null;
}
