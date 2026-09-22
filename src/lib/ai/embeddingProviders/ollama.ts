import "server-only";
import {
  EMBEDDING_DIMENSIONS,
  EmbeddingProviderResponseError,
  EmbeddingProviderUnavailableError,
  type EmbeddingProvider,
} from "@/lib/ai/embeddingProvider";

/**
 * Embeddings from a local (or self-hosted) Ollama server — same plain
 * `fetch`, same base URL, same no-SDK reasoning as the chat provider in
 * providers/ollama.ts.
 *
 * Endpoint: POST /api/embeddings with `{ model, prompt }`, responding
 * `{ embedding: number[] }`. Ollama also ships a newer `/api/embed`
 * (`{ model, input }` → `{ embeddings: number[][] }`) supporting batches;
 * `/api/embeddings` is the longer-standing single-text endpoint and is what
 * this uses, since retrieval embeds one query at a time and ingestion can
 * loop. ⚠️ Not yet verified against a live server — this environment has no
 * Ollama and can't reach one (see src/lib/ai/tests/README.md); if a future
 * Ollama release changes this shape, this file is the single place to fix.
 */
export class OllamaEmbeddingProvider implements EmbeddingProvider {
  private readonly baseUrl: string;
  private readonly model: string;

  constructor() {
    this.baseUrl = (process.env.OLLAMA_BASE_URL?.trim() || "http://localhost:11434").replace(/\/$/, "");
    this.model = process.env.EMBEDDING_MODEL?.trim() || "nomic-embed-text";
  }

  async embed(text: string): Promise<number[]> {
    let res: Response;
    try {
      res = await fetch(`${this.baseUrl}/api/embeddings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: this.model, prompt: text }),
      });
    } catch (err) {
      throw new EmbeddingProviderUnavailableError(
        `Could not reach Ollama at ${this.baseUrl}: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new EmbeddingProviderResponseError(
        `Ollama embeddings responded ${res.status}: ${detail.slice(0, 500)}`
      );
    }

    const payload = (await res.json().catch((err) => {
      throw new EmbeddingProviderResponseError(
        `Ollama returned invalid JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    })) as { embedding?: unknown };

    const embedding = payload.embedding;
    if (!Array.isArray(embedding) || embedding.some((n) => typeof n !== "number")) {
      throw new EmbeddingProviderResponseError("Ollama embeddings response had no numeric `embedding` array");
    }

    // Caught here rather than at the database: a wrong-width vector means
    // EMBEDDING_MODEL and the schema's vector(768) column disagree, and the
    // Postgres error for that ("expected 768 dimensions, not N") gives no
    // hint about which model produced it.
    if (embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new EmbeddingProviderResponseError(
        `Model "${this.model}" returned ${embedding.length}-dimensional vectors, but this system stores ` +
          `${EMBEDDING_DIMENSIONS} (see EMBEDDING_DIMENSIONS in embeddingProvider.ts). Either set ` +
          `EMBEDDING_MODEL back to a ${EMBEDDING_DIMENSIONS}-dimensional model, or migrate the ` +
          `KnowledgeChunk.embedding column and re-embed every chunk.`
      );
    }

    return embedding as number[];
  }
}
