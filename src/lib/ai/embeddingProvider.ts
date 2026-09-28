import "server-only";
import { OllamaEmbeddingProvider } from "./embeddingProviders/ollama";
import { GeminiEmbeddingProvider } from "./embeddingProviders/gemini";

/**
 * Embedding provider abstraction — the RAG counterpart to provider.ts.
 *
 * Deliberately a sibling of the chat provider rather than a method on it:
 * embedding and chat completion are different services with different
 * models (llama3.2 vs. nomic-embed-text), and a deployment can reasonably
 * use a local embedding model with a hosted chat model, or vice versa.
 * Keeping them separate means adding a hosted embedding provider later
 * touches one new file plus the factory below — the same shape as
 * provider.ts, and no change to the chat path at all.
 */

/** Dimension of the vectors this system stores. Must match both the
 * embedding model in use (nomic-embed-text → 768) and the `vector(768)`
 * column declared in prisma/schema.prisma. Changing it means re-embedding
 * every existing chunk and a schema migration — hence the runtime check in
 * each provider rather than silently storing a wrong-width vector. */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * What the text is for. Hosted models embed a stored passage and the
 * question asked of it differently, and saying which measurably improves
 * the match; providers without the notion ignore it.
 */
export type EmbeddingTask = "document" | "query";

export interface EmbeddingProvider {
  /** Returns one vector of EMBEDDING_DIMENSIONS floats for the given text. */
  embed(text: string, task?: EmbeddingTask): Promise<number[]>;
}

/** Thrown when the embedding service can't be reached at all (connection
 * refused, DNS failure, timeout). Mirrors AiProviderUnavailableError —
 * retrieval catches this and degrades to text search rather than failing
 * the whole chat turn. */
export class EmbeddingProviderUnavailableError extends Error {}

/** Thrown when the service responded but with an error, or returned a
 * vector of the wrong width (a model mismatch, which would otherwise only
 * surface later as a confusing Postgres dimension error). */
export class EmbeddingProviderResponseError extends Error {}

export type EmbeddingProviderName = "ollama" | "gemini";

/**
 * Selects the provider from EMBEDDING_PROVIDER (see .env.example).
 *
 * Defaults to Ollama, which is right for a laptop and wrong for Vercel —
 * its base URL is localhost, and on a serverless function that is the
 * function itself. A deployment that wants vector search set
 * EMBEDDING_PROVIDER=gemini; otherwise retrieval falls back to text search,
 * which works but ranks worse.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const name = (process.env.EMBEDDING_PROVIDER?.trim() || "ollama") as EmbeddingProviderName;

  switch (name) {
    case "ollama":
      return new OllamaEmbeddingProvider();
    case "gemini":
      return new GeminiEmbeddingProvider();
    default: {
      const exhaustiveCheck: never = name;
      throw new Error(`Unknown EMBEDDING_PROVIDER: ${exhaustiveCheck}`);
    }
  }
}
