import "server-only";
import {
  EMBEDDING_DIMENSIONS,
  EmbeddingProviderResponseError,
  EmbeddingProviderUnavailableError,
  type EmbeddingProvider,
  type EmbeddingTask,
} from "@/lib/ai/embeddingProvider";
import { explainGeminiStatus } from "@/lib/ai/geminiKey";

/**
 * Embeddings from Google's Generative Language API — the hosted counterpart
 * to embeddingProviders/ollama.ts, and the one a Vercel deployment can
 * actually reach. Ollama's default base URL is localhost, which on a
 * serverless function is the function itself; nothing answers there.
 *
 * Endpoint: POST /v1beta/models/{model}:embedContent with
 * `{ content: { parts: [{ text }] }, taskType, outputDimensionality }`,
 * responding `{ embedding: { values: number[] } }`.
 *
 * Same plain `fetch` and `?key=` auth as the chat provider in
 * providers/gemini.ts, for the same reason: one HTTP call does not justify
 * an SDK in the serverless bundle.
 *
 * Verified against the live API: a 768-dimensional request returns
 * `{ embedding: { values: [768 numbers] } }`, and those values come back
 * with a magnitude around 0.59 rather than 1 — so the normalise() below is
 * load-bearing, not defensive. Both `?key=` and the `x-goog-api-key` header
 * authenticate; the query string is used here to match providers/gemini.ts.
 */
/** Statuses that mean "not now" rather than "not ever" — same reasoning as the
 * chat provider in providers/gemini.ts. */
const RETRYABLE_STATUS = new Set([429, 500, 503]);

/**
 * Two retry budgets, because the two callers have opposite constraints.
 *
 * Ingestion embeds a whole site in a loop and will hit the free tier's
 * per-minute window every time (verified: a 57-document sync exhausted it at
 * 100 requests and left 39 chunks unvectorised). Google's own 429 says "retry
 * in ~10s", so the document budget is long enough to cross that boundary — a
 * slow sync that finishes beats a fast one that half-embeds.
 *
 * A query embedding is inside a visitor's chat turn, which has a wall-clock
 * budget and a person waiting. There, one quick retry is the most that is
 * worth spending; past that, retrieval's text-search fallback is a better
 * answer than a longer silence.
 */
const RETRY_DELAYS_MS: Record<"document" | "query", number[]> = {
  document: [1_500, 6_000, 12_000],
  query: [600],
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  private readonly apiKey: string;
  private readonly model: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    if (!apiKey) {
      throw new EmbeddingProviderUnavailableError(
        "GEMINI_API_KEY is not set, but EMBEDDING_PROVIDER is \"gemini\"."
      );
    }
    this.apiKey = apiKey;
    this.model = process.env.EMBEDDING_MODEL?.trim() || "gemini-embedding-001";
  }

  async embed(text: string, task: EmbeddingTask = "document"): Promise<number[]> {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}` +
      `:embedContent?key=${this.apiKey}`;

    const body = JSON.stringify({
      model: `models/${this.model}`,
      content: { parts: [{ text }] },
      // Asymmetric retrieval: a stored passage and the question asked of it
      // are embedded for different jobs, and saying which measurably improves
      // the match. Ollama has no equivalent and ignores this.
      taskType: task === "query" ? "RETRIEVAL_QUERY" : "RETRIEVAL_DOCUMENT",
      // Ask for the width this system stores rather than the model's native
      // 3072, so the existing vector(768) column and its HNSW index keep
      // working without a migration and a full re-embed.
      outputDimensionality: EMBEDDING_DIMENSIONS,
    });

    const delays = RETRY_DELAYS_MS[task === "query" ? "query" : "document"];
    let res: Response | null = null;
    let lastTransient = "";

    for (let attempt = 0; attempt < delays.length + 1; attempt++) {
      if (attempt > 0) await sleep(delays[attempt - 1]);

      try {
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
      } catch (err) {
        throw new EmbeddingProviderUnavailableError(
          `Could not reach the Gemini embedding API: ${err instanceof Error ? err.message : String(err)}`
        );
      }

      if (res.ok) break;

      const detail = await res.text().catch(() => "");
      // The key is in the query string, so it would otherwise ride along in
      // any error text Google echoes back — and from there into logs.
      const safe =
        `Gemini embeddings responded ${res.status}: ${redactKey(detail, this.apiKey).slice(0, 500)}` +
        (explainGeminiStatus(res.status) ?? "");

      if (!RETRYABLE_STATUS.has(res.status)) throw new EmbeddingProviderResponseError(safe);

      lastTransient = safe;
      res = null;
    }

    if (!res) {
      throw new EmbeddingProviderResponseError(
        `${lastTransient} (gave up after ${delays.length + 1} attempts)`
      );
    }

    const payload = (await res.json().catch((err) => {
      throw new EmbeddingProviderResponseError(
        `Gemini returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    })) as { embedding?: { values?: unknown } };

    const values = payload.embedding?.values;
    if (!Array.isArray(values) || values.some((n) => typeof n !== "number")) {
      throw new EmbeddingProviderResponseError(
        "Gemini embeddings response had no numeric `embedding.values` array"
      );
    }

    // Same guard as the Ollama provider: a wrong-width vector means
    // EMBEDDING_MODEL and the schema's vector(768) column disagree, and
    // Postgres's own error for that names no model.
    if (values.length !== EMBEDDING_DIMENSIONS) {
      throw new EmbeddingProviderResponseError(
        `Model "${this.model}" returned ${values.length}-dimensional vectors, but this system stores ` +
          `${EMBEDDING_DIMENSIONS} (see EMBEDDING_DIMENSIONS in embeddingProvider.ts). Either set ` +
          `EMBEDDING_MODEL to a model that can emit ${EMBEDDING_DIMENSIONS} dimensions, or migrate the ` +
          `KnowledgeChunk.embedding column and re-embed every chunk.`
      );
    }

    // Gemini normalises only its native full-width output; a truncated
    // dimensionality comes back unnormalised — measured at magnitude ~0.59
    // for a 768-wide request — and cosine distance over unnormalised
    // vectors ranks by magnitude as much as by direction. Normalising an
    // already-unit vector is a no-op, so this is safe whichever model is
    // configured.
    return normalise(values as number[]);
  }
}

function normalise(vector: number[]): number[] {
  const magnitude = Math.sqrt(vector.reduce((sum, v) => sum + v * v, 0));
  // An all-zero vector has no direction to preserve; returning it unchanged
  // beats dividing by zero and storing NaNs that poison every later search.
  if (magnitude === 0) return vector;
  return vector.map((v) => v / magnitude);
}

function redactKey(text: string, key: string): string {
  return key ? text.split(key).join("[redacted]") : text;
}
