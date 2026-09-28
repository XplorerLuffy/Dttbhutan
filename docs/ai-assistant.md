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
| `GEMINI_API_KEY` | (the AI Studio key) | Also used for embeddings |
| `EMBEDDING_PROVIDER` | `gemini` | Same localhost problem as above |
| `EMBEDDING_MODEL` | `gemini-embedding-001` | Must emit 768 dimensions |

`GEMINI_MODEL` defaults to `gemini-3.6-flash` and needs setting only to
change models.

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

Eight documents, twelve chunks, all embedded. Two sources:

- **Published `Article` rows** — indexed, not copied. The Article stays the
  source of truth for the travel-guide pages; re-running ingestion refreshes
  the searchable copy. Three today: visa & entry, the SDF, best time to
  visit.
- **`prisma/data/knowledgeSeed.ts`** — text with no database home yet:
  booking FAQ, the guide requirement, cancellation, payments, and one
  INTERNAL staff note.

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

Editing an Article in the admin does **not** update the knowledge base on
its own — the searchable copy is only refreshed by running ingestion. That
is a deliberate trade (no embedding API call inside an admin save) and a
reasonable thing to automate later.

### Why both sides must use the same embedding model

Vectors from different models are not comparable. A query embedded by one
model against chunks embedded by another returns quietly nonsensical
results rather than an error, so switching `EMBEDDING_MODEL` means
re-ingesting everything. The column is `vector(768)`; changing width also
needs a migration.

## Checking it actually works

Two opt-in checks, deliberately outside `npm run test:ai` because they cost
API calls and their output needs a person to read it:

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
