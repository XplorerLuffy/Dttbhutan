# The travel assistant

The chat assistant at `/api/chat`. It answers from the database and from an
ingested knowledge base, and it is built so that it *cannot* invent a price:
every figure it states came from a Postgres query in that conversation. See
`src/lib/ai/systemPrompt.ts` for the rules and `src/lib/ai/tests/README.md`
for what is and isn't provable by test.

## It was silently broken in production until 28 September 2026

Worth recording, because the failure mode was invisible. Production held
three visitor questions from September and **zero** assistant replies:

| When | Question |
| --- | --- |
| 22 Sep | "Help me plan a trip" |
| 23 Sep | "Help me plan a trip" |
| 27 Sep | "Which destinations would you recommend?" |

Two causes, both configuration rather than code:

1. **`AI_PROVIDER` was unset.** The factory in `src/lib/ai/provider.ts`
   defaults to `"ollama"`, and the Ollama provider's base URL defaults to
   `http://localhost:11434`. On a Vercel serverless function, localhost is
   the function itself, so nothing answered. The route turned that into a
   clean 503 ("temporarily unavailable"), which is why nothing looked broken
   from the outside — visitors just saw a polite failure.
2. **The knowledge base was empty**, and there was no `Agency` row at all,
   so `search_knowledge` returned "no knowledge base is configured".

The lesson worth keeping: a provider default that works on a laptop and
fails in production is worse than no default. `.env.example` now says so at
both `AI_PROVIDER` and `EMBEDDING_PROVIDER`.

## Production configuration

Set in the Vercel dashboard (Project → Settings → Environment Variables),
for Production, Preview and Development:

| Variable | Value | Why |
| --- | --- | --- |
| `AI_PROVIDER` | `gemini` | Without it the default is unreachable Ollama |
| `GEMINI_API_KEY` | a key from [AI Studio](https://aistudio.google.com/apikey) (`AIza…` or `AQ.…`) | Also used for embeddings |
| `EMBEDDING_PROVIDER` | `gemini` | Same localhost problem as above |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | Must emit 768 dimensions |

`GEMINI_MODEL` defaults to `gemini-3.6-flash` and needs setting only to
change models.

### If the assistant returns 401

Google answers an unrecognised credential with

> 401 UNAUTHENTICATED — Request had invalid authentication credentials.
> Expected OAuth 2 access token, login cookie or other valid authentication credential.

**This message is misleading.** It is what a *deleted or regenerated API key*
produces; it does not mean the endpoint wants OAuth. Verified against the live
API: a revoked key and a bearer token give the identical 401, while a malformed
key gives `400 API key not valid`.

Google issues API keys in two shapes and **both are valid, long-lived API keys**:

| Prefix | Notes |
| --- | --- |
| `AIza…` | the long-standing format |
| `AQ.…` | issued by [AI Studio](https://aistudio.google.com/apikey) since mid-2026; newly created keys generally look like this |

The prefix says nothing about whether a key works, so no code inspects it. An
earlier version of this provider rejected `AQ.` keys at construction on the
mistaken reading that they were short-lived OAuth tokens — they are not, and
that guard would have locked out any deployment issued one. `geminiKey.ts` now
only translates the status code, and the test suite pins that both shapes
construct.

So on a 401, check the key still exists in AI Studio and was copied whole. On a
403, the key is recognised but the Generative Language API may be disabled on
its project, or an API/referrer restriction may exclude the call.

Neither is retried — only 429, 500 and 503 are (`RETRYABLE_STATUS` in
`src/lib/ai/providers/gemini.ts`). Retrying a bad credential burns the
request's time budget and still fails.

### Ollama's hosted service as the provider

`AI_PROVIDER="ollama"` is viable on Vercel when `OLLAMA_BASE_URL` points at
Ollama's own service instead of localhost:

```
AI_PROVIDER="ollama"
OLLAMA_BASE_URL="https://ollama.com"
OLLAMA_API_KEY="…"           # https://ollama.com/settings/keys
OLLAMA_MODEL="gpt-oss:20b"
```

The key travels as `Authorization: Bearer` (`x-api-key` alone is rejected) and
does not expire — unlike a quota-limited free tier, which is the main reason to
prefer it over Gemini for this deployment.

Verified against the live service from a sandbox with egress to ollama.com:

- **Chat works.** `POST /api/chat` returns 200.
- **Tool calling works**, which is what the assistant actually needs — the model
  returned `{"id": "call_vbc2qebq", "function": {"name": "search_knowledge",
  "arguments": {"query": "cancellation policy"}}}` for a tool it was offered.
  Note it sends a real call id, which a local server does not; the provider
  keeps whichever it gets.
- **Embeddings are NOT available.** `/api/embeddings` 404s ("path not found")
  and `/api/embed` 401s for every embedding model tried. `/api/tags` lists 17
  models and all of them are generative — `gpt-oss:20b`, `gpt-oss:120b`,
  `gemma4:31b`, `kimi-k3`, `deepseek-v4.1-flash` and so on — with no embedding
  model among them.

So the two halves are configured separately, and **`EMBEDDING_PROVIDER` cannot
be `"ollama"` against the hosted service.** Leave it on `"gemini"` with a
working key; that is also what the stored vectors were written with, so it
avoids a re-ingest (see EMBEDDING_MODEL in `.env.example` — both sides of a
search must use the same model).

Without any embedding provider the assistant still answers: `retrieveKnowledge`
catches an unavailable embedder and falls back to Postgres text search, marking
the result `mode: "text-fallback"`. Ranking is worse than semantic search, but
the policies and FAQs stay reachable rather than dropping out of the answer.

### Free-tier quota is the live constraint

The free tier allows only a handful of requests per minute, and **one chat
turn costs two or more calls** because the model calls a tool and then
answers. The app's own limiter is 8 requests/minute per IP
(`src/lib/ai/rateLimit.ts`), which is looser than the quota — so two
simultaneous visitors can exhaust it. A 429 surfaces as a 503 with the
"temporarily unavailable" message rather than an error page, so it fails
gracefully, but the visitor still gets no answer. **Enable billing on the
Google Cloud project behind the key before the site takes real traffic.**

## The knowledge base

57 documents, 140 chunks, all embedded. Three sources:

- **Published `Article`, `Itinerary` and `Destination` rows** — indexed, not
  copied. Those rows stay the source of truth the website renders from;
  refreshing rebuilds the searchable copy. See `src/lib/ai/siteKnowledge.ts`,
  which the admin screen and the CLI script share.
- **`prisma/data/knowledgeSeed.ts`** — text with no database home yet:
  booking FAQ, the guide requirement, cancellation, payments, and one
  INTERNAL staff note.
- **Hand-authored documents written in `/admin/knowledge`** — anything else
  DRUKA should know, added without a developer. Same pipeline, no `sourceRef`.

Visibility matters: the INTERNAL note is excluded from `/api/chat`, which
hardcodes `["PUBLIC"]` because the endpoint is anonymous. Verified in
production — a nearest-neighbour search from the SDF chunk returns the five
nearest PUBLIC chunks and never the staff note.

### Refreshing it after editing an Article or the seed

```bash
GEMINI_API_KEY=… EMBEDDING_PROVIDER=gemini \
  npm run ai:ingest -- --allow-production      # needs DATABASE_URL = Supabase
```

Ingestion is idempotent: each document carries a `sourceRef` and replaces
any previous document with the same one, so re-running leaves one current
copy rather than accumulating duplicates. It also upserts the `Agency` row.
Without `--allow-production` it refuses any non-local `DATABASE_URL`.

Editing an Article, package or destination does **not** update the knowledge
base on its own. The searchable copy is refreshed either by the script above
or by **Refresh from website content** on `/admin/knowledge` — a deliberate
trade, so an admin saving a package never waits on an embedding API call.

### Editing knowledge from the admin dashboard

`/admin/knowledge` lists every document and splits them by who owns the text.

**Written by you** — `MANUAL`, `FAQ`, `POLICY`, `UPLOAD`. Fully editable:
create, edit, delete. Saving re-chunks and re-embeds through
`reingestDocument`, which keeps the document id (so the edit URL survives a
save) and *replaces* the chunks rather than adding to them. That replacement
is load-bearing, not tidiness: `KnowledgeChunk` carries its own copy of
`visibility` because retrieval filters on the chunk row, so leaving stale
chunks behind after a PUBLIC → INTERNAL edit would keep serving staff-only
text to the anonymous chat widget. `npm run test:ai:knowledge` pins that.

**Read from your website** — `ARTICLE`, `PACKAGE`, `DESTINATION`. Listed but
not editable, and the API refuses a PATCH or DELETE with 409: these are
regenerated on every refresh, so a hand edit would appear to save and then
silently revert. Each row links to the admin screen where the real record
lives.

The refresh button sends one request per kind — packages, then destinations,
then articles — because a full re-index is more embedding calls than a
serverless function's 60 seconds allows. `syncSiteKnowledge(agencyId, scope)`
takes the scope; `"all"` remains for the CLI, which has no such limit.

Two things the screen surfaces that nothing else did:

- how many passages a save actually embedded, and the provider error when it
  embedded none — a document stored without vectors is findable by keyword
  only, and that is otherwise invisible
- a running count of unembedded chunks across the whole base, so a
  half-indexed knowledge base is visible at a glance

### Why both sides must use the same embedding model

Vectors from different models are not comparable. A query embedded by one
model against chunks embedded by another returns quietly nonsensical
results rather than an error, so switching `EMBEDDING_MODEL` means
re-ingesting everything. The column is `vector(768)`; changing width also
needs a migration.

## Checking it actually works

`npm run test:ai:knowledge` round-trips an admin edit against a real database
(create → retrieve → edit → change visibility → draft → delete, restoring what
it found). It sits outside `npm run test:ai` because every other test in that
suite is pure and runs anywhere, while this one needs Postgres with pgvector
and the seeded agency. It stubs only the embedding HTTP call, with hashed
bag-of-words vectors, so shared vocabulary still means a small cosine distance
and the distance threshold stays meaningful.

Two further opt-in checks, deliberately outside `npm run test:ai` because they
cost API calls and their output needs a person to read it:

```bash
# Do real embeddings put a question near its answer?
GEMINI_API_KEY=… EMBEDDING_PROVIDER=gemini npm run check:ai:semantic

# What does the live model actually say?
GEMINI_API_KEY=… AI_PROVIDER=gemini EMBEDDING_PROVIDER=gemini npm run check:ai:live
```

`check:ai:semantic` asks six questions phrased to share almost no words with
the document that should answer them — "what's the daily levy visitors have
to pay" should find the SDF guide. All six passed at distances of 0.29–0.41,
well inside the 0.75 cutoff.

`check:ai:live` prints replies for the six safety scenarios. Reading them is
the point; there is no assertion for "did the model behave". Last run: quoted
the real 45,000 BTN for a package, refused to invent a price for one that
doesn't exist, refused to claim a booking, and answered the cancellation
policy from the agency's own guidance.

## One trap in the prompt, since it will recur

Rule 5 originally said never to state visa, fee or cancellation facts
because they "aren't something your tools cover". True when written, false
once the knowledge base existed — and the model obeyed it: asked for the
cancellation policy it returned a clarifying question while the answer sat
0.31 cosine away in a chunk it declined to look up. The rule now routes
those questions to `search_knowledge` and still forbids answering from
memory.

The general shape: **a safety rule that names a capability gap goes stale
when the gap closes**, and a stale prohibition is indistinguishable from
the model being unhelpful. `systemPrompt.test.ts` now asserts the routing,
so the same drift fails a test next time.
