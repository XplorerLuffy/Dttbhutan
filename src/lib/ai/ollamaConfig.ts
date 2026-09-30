import "server-only";

/**
 * Where to reach Ollama, and how to authenticate.
 *
 * The same server software answers on localhost and at Ollama's hosted service,
 * with the same paths and the same request bodies — the only difference is that
 * the hosted one wants an API key. So both providers share this rather than each
 * deciding: chat and embeddings must agree on the host, or retrieval would query
 * one server with vectors written by another.
 *
 * Hosted usage is `OLLAMA_BASE_URL=https://ollama.com` plus `OLLAMA_API_KEY`
 * (https://ollama.com/settings/keys). Per Ollama's docs the credential must be
 * sent as `Authorization: Bearer …` — `x-api-key` alone is rejected — and the
 * keys do not expire. A local server ignores the header, so setting a key
 * against localhost is harmless rather than an error worth guarding.
 */
export function ollamaBaseUrl(): string {
  return (process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434").replace(/\/$/, "");
}

export function ollamaHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const apiKey = process.env.OLLAMA_API_KEY?.trim();
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  return headers;
}

/**
 * Turns a status into a sentence that names the likely cause, for statuses
 * where "responded 401" on its own sends you looking in the wrong place.
 *
 * Only 401 is treated as an auth problem. 403 deliberately is not: an outbound
 * proxy returns 403 for a blocked host, and this helper claimed a rejected API
 * key for exactly that — a wrong answer that costs someone an hour. Verified
 * shapes from the live service: 404 is an unknown model and 410 a retired one,
 * both of which name the model in the body, so neither needs help from here.
 */
export function explainOllamaStatus(status: number, baseUrl: string): string {
  const hosted = !/localhost|127\.0\.0\.1/.test(baseUrl);
  if (!hosted) return "";

  if (status === 401) {
    return process.env.OLLAMA_API_KEY?.trim()
      ? " — OLLAMA_API_KEY is set but was rejected; check it at https://ollama.com/settings/keys."
      : " — OLLAMA_API_KEY is not set, and this host requires one.";
  }
  if (status === 404 || status === 410) {
    return ` — OLLAMA_MODEL is "${process.env.OLLAMA_MODEL?.trim() || "(unset, defaulting to llama3.2)"}"; the hosted service serves a specific list, which GET /api/tags returns.`;
  }
  return "";
}
