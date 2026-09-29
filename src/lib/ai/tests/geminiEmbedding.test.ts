/**
 * Gemini embedding provider tests. Run with: npm run test:ai:embedding
 *
 * What these DO test, for real, by stubbing `fetch` and inspecting the
 * request the provider builds and how it handles each reply:
 *   - the request carries the right model, dimensionality and task type
 *   - a document and a query are embedded for DIFFERENT jobs, which is the
 *     whole point of asymmetric retrieval
 *   - a wrong-width vector is rejected with a message naming the model,
 *     rather than reaching Postgres as an opaque dimension error
 *   - a truncated (unnormalised) vector is normalised to unit length, so
 *     cosine distance ranks by direction rather than magnitude
 *   - the API key never appears in an error message, and so never in logs
 *   - a network failure and an HTTP error are distinguishable, because
 *     retrieval degrades to text search on the first and not the second
 *
 * What these deliberately do NOT claim:
 *   - that the real endpoint still replies in this shape. The contract was
 *     checked by hand against the live API (768 values, magnitude ~0.59,
 *     both auth forms accepted) but a stubbed fetch cannot re-check it on
 *     every run: these pin OUR behaviour given a reply, not Google's. When
 *     Google moves the shape, this suite stays green and ingestion is what
 *     breaks — see tests/README.md for the live check.
 */
import {
  EMBEDDING_DIMENSIONS,
  EmbeddingProviderResponseError,
  EmbeddingProviderUnavailableError,
} from "@/lib/ai/embeddingProvider";
import { GeminiEmbeddingProvider } from "@/lib/ai/embeddingProviders/gemini";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.log(`FAIL  ${name}${detail ? " — " + detail : ""}`);
  }
}

const KEY = "test-key-do-not-use";
const realFetch = globalThis.fetch;

type Captured = { url: string; body: Record<string, unknown> };

/** Installs a fetch that returns `reply` and records what was sent. */
function stubFetch(reply: Response | Error): Captured {
  const captured: Captured = { url: "", body: {} };
  globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    captured.url = String(input);
    captured.body = JSON.parse(String(init?.body ?? "{}"));
    if (reply instanceof Error) throw reply;
    return reply;
  }) as typeof fetch;
  return captured;
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function vectorOf(length: number, value: number): number[] {
  return Array.from({ length }, () => value);
}

async function main() {
  process.env.GEMINI_API_KEY = KEY;
  delete process.env.EMBEDDING_MODEL;

  // --- request shape -------------------------------------------------------
  {
    const sent = stubFetch(
      jsonResponse({ embedding: { values: vectorOf(EMBEDDING_DIMENSIONS, 0.5) } })
    );
    await new GeminiEmbeddingProvider().embed("a passage about visas", "document");

    check("asks for the width this system stores", sent.body.outputDimensionality === EMBEDDING_DIMENSIONS);
    check("a document is embedded as RETRIEVAL_DOCUMENT", sent.body.taskType === "RETRIEVAL_DOCUMENT");
    check("hits the embedContent endpoint", sent.url.includes(":embedContent"));
    check(
      "defaults to a model that can emit this width",
      sent.url.includes("gemini-embedding-001"),
      sent.url
    );
  }

  {
    const sent = stubFetch(
      jsonResponse({ embedding: { values: vectorOf(EMBEDDING_DIMENSIONS, 0.5) } })
    );
    await new GeminiEmbeddingProvider().embed("do I need a visa?", "query");
    check("a query is embedded as RETRIEVAL_QUERY", sent.body.taskType === "RETRIEVAL_QUERY");
  }

  {
    const sent = stubFetch(
      jsonResponse({ embedding: { values: vectorOf(EMBEDDING_DIMENSIONS, 0.5) } })
    );
    await new GeminiEmbeddingProvider().embed("no task given");
    check(
      "defaults to document, the ingestion case",
      sent.body.taskType === "RETRIEVAL_DOCUMENT"
    );
  }

  // --- normalisation -------------------------------------------------------
  {
    stubFetch(jsonResponse({ embedding: { values: vectorOf(EMBEDDING_DIMENSIONS, 4) } }));
    const vector = await new GeminiEmbeddingProvider().embed("unnormalised");
    const magnitude = Math.sqrt(vector.reduce((s, v) => s + v * v, 0));
    check(
      "an unnormalised vector comes back unit length",
      Math.abs(magnitude - 1) < 1e-9,
      `magnitude ${magnitude}`
    );
  }

  {
    // Already unit length: 1/sqrt(768) in every slot.
    const unit = vectorOf(EMBEDDING_DIMENSIONS, 1 / Math.sqrt(EMBEDDING_DIMENSIONS));
    stubFetch(jsonResponse({ embedding: { values: unit } }));
    const vector = await new GeminiEmbeddingProvider().embed("already normalised");
    const drift = Math.max(...vector.map((v, i) => Math.abs(v - unit[i])));
    check("normalising an already-unit vector changes nothing", drift < 1e-12, `drift ${drift}`);
  }

  {
    stubFetch(jsonResponse({ embedding: { values: vectorOf(EMBEDDING_DIMENSIONS, 0) } }));
    const vector = await new GeminiEmbeddingProvider().embed("all zeroes");
    check(
      "an all-zero vector does not become NaNs",
      vector.every((v) => Number.isFinite(v)),
      "divide-by-zero would poison every later search"
    );
  }

  // --- guards --------------------------------------------------------------
  {
    stubFetch(jsonResponse({ embedding: { values: vectorOf(3072, 0.1) } }));
    let message = "";
    try {
      await new GeminiEmbeddingProvider().embed("wrong width");
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("a wrong-width vector is rejected", message.includes("3072"), message);
    check(
      "and the error names the model, which Postgres never would",
      message.includes("gemini-embedding-001"),
      message
    );
  }

  {
    stubFetch(jsonResponse({ nope: true }));
    let caught: unknown;
    try {
      await new GeminiEmbeddingProvider().embed("malformed");
    } catch (err) {
      caught = err;
    }
    check("a reply with no values array is a response error", caught instanceof EmbeddingProviderResponseError);
  }

  {
    stubFetch(new TypeError("fetch failed"));
    let caught: unknown;
    try {
      await new GeminiEmbeddingProvider().embed("unreachable");
    } catch (err) {
      caught = err;
    }
    check(
      "an unreachable API is Unavailable, so retrieval degrades to text search",
      caught instanceof EmbeddingProviderUnavailableError
    );
  }

  {
    stubFetch(jsonResponse({ error: { message: `key ${KEY} is invalid` } }, 400));
    let message = "";
    try {
      await new GeminiEmbeddingProvider().embed("bad key");
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("an HTTP error is a response error, not Unavailable", message.includes("400"), message);
    check("and the API key is redacted out of it", !message.includes(KEY), message);
  }

  {
    delete process.env.GEMINI_API_KEY;
    let caught: unknown;
    try {
      new GeminiEmbeddingProvider();
    } catch (err) {
      caught = err;
    }
    check(
      "a missing key fails loudly at construction",
      caught instanceof EmbeddingProviderUnavailableError
    );
  }

  // An OAuth access token in GEMINI_API_KEY works for about an hour and then
  // 401s. Caught at construction so the message names the remedy, rather than
  // surfacing later as an auth error that looks like a revoked key.
  {
    process.env.GEMINI_API_KEY = "AQ.Ab8RNotARealTokenJustTheShape";
    let caught: unknown;
    try {
      new GeminiEmbeddingProvider();
    } catch (err) {
      caught = err;
    }
    const message = caught instanceof Error ? caught.message : "";
    check(
      "an OAuth access token is rejected at construction, not an hour later",
      caught instanceof EmbeddingProviderUnavailableError
    );
    check(
      "and the message says to create an API key instead",
      message.includes("aistudio.google.com/apikey") && message.includes("AIza"),
      message
    );
    check(
      "and it does not echo the token back",
      !message.includes("AQ.Ab8RNotARealTokenJustTheShape"),
      message
    );
  }

  // The long-lived kind must still be accepted — the guard is shape-based, so
  // a regression here would lock out every real deployment.
  {
    process.env.GEMINI_API_KEY = "AIzaSyNotARealKeyJustTheShape0123456789";
    let caught: unknown;
    try {
      new GeminiEmbeddingProvider();
    } catch (err) {
      caught = err;
    }
    check("an AIza API key is accepted at construction", caught === undefined);
  }

  globalThis.fetch = realFetch;
  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  globalThis.fetch = realFetch;
  console.error("Test harness crashed:", err);
  process.exitCode = 1;
});
