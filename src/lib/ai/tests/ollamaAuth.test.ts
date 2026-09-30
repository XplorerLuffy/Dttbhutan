/**
 * Ollama hosted-service auth. Run with: npm run test:ai:ollama
 *
 * The chat and embedding providers were written against a local server, which
 * needs no credential. Pointing them at Ollama's hosted service adds one — and
 * an API key that silently fails to travel is the kind of bug that only shows
 * up as a 401 in production, so these pin the wiring by stubbing `fetch` and
 * reading the request that was actually built.
 *
 * What these check:
 *   - the key rides as `Authorization: Bearer …`, which is the form Ollama's
 *     docs require (an `x-api-key` header alone is rejected)
 *   - no Authorization header at all when no key is configured, so a local
 *     server is addressed exactly as before
 *   - chat and embeddings agree on base URL and key — they must hit the same
 *     server, or stored vectors and query vectors come from different models
 *   - a trailing slash on the base URL doesn't produce `//api/chat`
 *   - a 401 from a remote host is explained in terms of OLLAMA_API_KEY, and
 *     distinguishes "not set" from "set but rejected"
 *   - a local base URL gets no such advice, since it needs no key
 */
import { OllamaProvider } from "@/lib/ai/providers/ollama";
import { OllamaEmbeddingProvider } from "@/lib/ai/embeddingProviders/ollama";

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail?: string) {
  if (condition) {
    passed++;
    console.log(`PASS  ${name}`);
  } else {
    failed++;
    console.error(`FAIL  ${name}${detail ? `\n      ${detail}` : ""}`);
  }
}

const realFetch = globalThis.fetch;
const KEY = "test-key-not-a-real-one";

type Captured = { url: string; headers: Record<string, string> };

/** Replaces fetch with one that records the request and returns `body`. */
function capture(body: unknown, status = 200): { calls: Captured[] } {
  const calls: Captured[] = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries((init?.headers ?? {}) as Record<string, string>)) {
      headers[k.toLowerCase()] = v;
    }
    calls.push({ url: String(url), headers });
    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
  return { calls };
}

const CHAT_OK = { message: { role: "assistant", content: "hi" }, done: true };
const EMBED_OK = { embedding: Array.from({ length: 768 }, () => 0.1) };

async function main() {
  const originalEnv = { ...process.env };

  // --- hosted: the key must travel as a bearer token ---
  {
    process.env.OLLAMA_BASE_URL = "https://ollama.com";
    process.env.OLLAMA_API_KEY = KEY;
    process.env.OLLAMA_MODEL = "gpt-oss:20b";

    const chat = capture(CHAT_OK);
    await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    check("chat posts to the configured host", chat.calls[0]?.url === "https://ollama.com/api/chat", chat.calls[0]?.url);
    check(
      "chat sends Authorization: Bearer",
      chat.calls[0]?.headers.authorization === `Bearer ${KEY}`,
      JSON.stringify(chat.calls[0]?.headers)
    );

    const embed = capture(EMBED_OK);
    await new OllamaEmbeddingProvider().embed("hi");
    check("embeddings post to the same host", embed.calls[0]?.url === "https://ollama.com/api/embeddings", embed.calls[0]?.url);
    check(
      "embeddings send the same bearer token",
      embed.calls[0]?.headers.authorization === `Bearer ${KEY}`,
      JSON.stringify(embed.calls[0]?.headers)
    );
  }

  // --- tool-call ids: the hosted service sends one, a local server does not ---
  {
    process.env.OLLAMA_BASE_URL = "https://ollama.com";
    process.env.OLLAMA_API_KEY = KEY;

    // Shape copied from a real hosted reply.
    capture({
      message: {
        role: "assistant",
        content: "",
        tool_calls: [
          { id: "call_vbc2qebq", function: { index: 0, name: "search_knowledge", arguments: { query: "cancellation policy" } } },
        ],
      },
      done: true,
    });
    let result = await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    check("the hosted service's own tool-call id is kept", result.toolCalls[0]?.id === "call_vbc2qebq", result.toolCalls[0]?.id);
    check("the tool name and arguments survive", result.toolCalls[0]?.name === "search_knowledge" && (result.toolCalls[0]?.arguments as { query?: string }).query === "cancellation policy");

    // A local server omits the id entirely — one still has to be produced.
    capture({
      message: { role: "assistant", content: "", tool_calls: [{ function: { name: "search_knowledge", arguments: {} } }] },
      done: true,
    });
    result = await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    check("an id is synthesized when the server sends none", result.toolCalls[0]?.id === "ollama_call_0", result.toolCalls[0]?.id);
  }

  // --- local: no key, no header ---
  {
    delete process.env.OLLAMA_API_KEY;
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";

    const chat = capture(CHAT_OK);
    await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    check("no Authorization header when no key is set", chat.calls[0]?.headers.authorization === undefined);
    check("content-type is still sent", chat.calls[0]?.headers["content-type"] === "application/json");
  }

  // --- a trailing slash must not double up ---
  {
    process.env.OLLAMA_BASE_URL = "https://ollama.com/";
    const chat = capture(CHAT_OK);
    await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    check("a trailing slash on the base URL is trimmed", chat.calls[0]?.url === "https://ollama.com/api/chat", chat.calls[0]?.url);
  }

  // --- a 401 from a remote host names the variable ---
  {
    process.env.OLLAMA_BASE_URL = "https://ollama.com";
    delete process.env.OLLAMA_API_KEY;
    capture({ error: "unauthorized" }, 401);
    let message = "";
    try {
      await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("a 401 with no key says the key is not set", message.includes("is not set"), message);

    process.env.OLLAMA_API_KEY = KEY;
    capture({ error: "unauthorized" }, 401);
    message = "";
    try {
      await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("a 401 with a key says it was rejected", message.includes("was rejected"), message);
    check("and points at the key settings page", message.includes("ollama.com/settings/keys"), message);
    check("and does not echo the key itself", !message.includes(KEY), message);
  }

  // --- transient upstream failures are retried ---
  // Production answered a visitor "temporarily unavailable" because the hosted
  // service returned one 500 mid-turn. These pin that a blip is ridden out and
  // that a settled 4xx still fails fast.
  {
    process.env.OLLAMA_BASE_URL = "https://ollama.com";
    process.env.OLLAMA_API_KEY = KEY;

    let attempts = 0;
    globalThis.fetch = (async () => {
      attempts++;
      if (attempts < 3) return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
      return new Response(JSON.stringify(CHAT_OK), { status: 200 });
    }) as typeof fetch;

    const result = await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    check("a 500 is retried until it succeeds", attempts === 3 && result.content === "hi", `attempts=${attempts}`);

    // A 404 is a settled fact (unknown model) — retrying only burns the budget.
    attempts = 0;
    globalThis.fetch = (async () => {
      attempts++;
      return new Response(JSON.stringify({ error: "model 'x' not found" }), { status: 404 });
    }) as typeof fetch;
    let message = "";
    try {
      await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("a 404 fails on the first attempt", attempts === 1, `attempts=${attempts}`);
    check("and a 404 names OLLAMA_MODEL", message.includes("OLLAMA_MODEL"), message);

    // Give up rather than loop forever.
    attempts = 0;
    globalThis.fetch = (async () => {
      attempts++;
      return new Response(JSON.stringify({ error: "Internal Server Error" }), { status: 500 });
    }) as typeof fetch;
    message = "";
    try {
      await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("a persistent 500 gives up after 3 attempts", attempts === 3, `attempts=${attempts}`);
    check("and says so", message.includes("gave up after 3 attempts"), message);
  }

  // --- a proxy 403 must not be blamed on the API key ---
  {
    process.env.OLLAMA_BASE_URL = "https://ollama.com";
    process.env.OLLAMA_API_KEY = KEY;
    capture({ error: "Host not in allowlist: ollama.com" }, 403);
    let message = "";
    try {
      await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("a 403 is not reported as a rejected key", !message.includes("was rejected"), message);
  }

  // --- localhost gets no hosted-service advice ---
  {
    process.env.OLLAMA_BASE_URL = "http://localhost:11434";
    capture({ error: "nope" }, 401);
    let message = "";
    try {
      await new OllamaProvider().complete({ messages: [{ role: "user", content: "hi" }] });
    } catch (err) {
      message = err instanceof Error ? err.message : String(err);
    }
    check("a local 401 is not blamed on OLLAMA_API_KEY", !message.includes("OLLAMA_API_KEY"), message);
  }

  globalThis.fetch = realFetch;
  process.env = originalEnv;
  console.log(`\n${passed}/${passed + failed} checks passed`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((err) => {
  globalThis.fetch = realFetch;
  console.error("Test harness crashed:", err);
  process.exitCode = 1;
});
