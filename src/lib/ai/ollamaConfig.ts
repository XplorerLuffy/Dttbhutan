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

/** Ollama's hosted service refuses an unauthenticated or unknown key with 401,
 * and a plain "responded 401" leaves it ambiguous whether the key is wrong or
 * simply absent — which matters most on a deployment, where the difference is
 * an unset environment variable rather than a bad paste. */
export function explainOllamaStatus(status: number, baseUrl: string): string {
  if (status !== 401 && status !== 403) return "";
  const hosted = !/localhost|127\.0\.0\.1/.test(baseUrl);
  if (!hosted) return "";
  return process.env.OLLAMA_API_KEY?.trim()
    ? " — OLLAMA_API_KEY is set but was rejected; check it at https://ollama.com/settings/keys."
    : " — OLLAMA_API_KEY is not set, and this host requires one.";
}
