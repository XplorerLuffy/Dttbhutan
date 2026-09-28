# AI assistant tests

No test framework (jest/vitest) is installed in this project, so these run
as plain scripts via `tsx` — the same way `prisma/seed.ts` does — rather
than introducing a new dependency for Phase 1.

```bash
npm run test:ai:tools         # grounding tools against the real dev DB
npm run test:ai:assistant     # orchestration loop, via a scripted mock provider
npm run test:ai:ratelimit     # rate limiter, pure logic
npm run test:ai:systemprompt  # system prompt contains the required safety rules
npm run test:ai:route         # POST /api/chat itself: 400/429/503/500/200 paths
npm run test:ai:retrieval     # RAG: tenant isolation, PUBLIC/INTERNAL, pgvector, fallback
npm run test:ai:embedding     # Gemini embedding provider, against a stubbed fetch
npm run test:ai               # all seven
```

`test:ai:retrieval` needs pgvector on the local database:

```bash
sudo apt-get install -y postgresql-16-pgvector      # or your platform's package
sudo -u postgres psql -d template1 -c "CREATE EXTENSION IF NOT EXISTS vector;"
sudo -u postgres psql -d <your_db> -c "CREATE EXTENSION IF NOT EXISTS vector;"
```

(`template1` matters because Prisma creates a throwaway shadow database for
migrations, which inherits from it — without the extension there,
`prisma migrate dev` fails on the `vector(768)` column.)

`serverOnlyPreload.cjs` exists only so these scripts can `require()` code
that imports the `server-only` marker package (used throughout `src/lib/`
for real safety reasons — don't remove it from application files). It
intercepts nothing except that one specifier; see the file's own comment.

## What these tests can and can't prove

**Can prove, and do, deterministically:**
- The application layer never fabricates a price: `get_package_details`,
  `search_guides`, etc. return the exact `Decimal` value stored in Postgres,
  or an explicit `found: false` when nothing matches — never a guess.
- The orchestration loop calls tools correctly, feeds results back in the
  wire shape the provider needs, and terminates (via `MAX_TOOL_ROUNDS`) even
  against a model that never stops requesting tools.
- Conversation history is assembled in order, so a follow-up like "I have 7
  days" arrives to the model alongside the earlier "I want to visit Bhutan."
- The rate limiter allows normal use and blocks rapid-fire requests, per IP.

**RAG-specific, and what the retrieval tests do and don't cover:**
- *Do prove, against real Postgres + real pgvector:* tenant isolation
  (agency A can never retrieve agency B's chunks), PUBLIC/INTERNAL
  separation, DRAFT exclusion, the relevance-distance cutoff, the
  text-search fallback when no embedding provider is reachable, and that an
  injection string inside a document comes back as inert text with no
  special parsing. Fixture vectors are hand-written unit vectors so
  nearest-neighbour ordering is deterministic without a model.
- *Cannot prove here:* that **real** embeddings are semantically useful —
  i.e. that embedding "what's your cancellation policy" actually lands near
  the cancellation chunk. Fixture vectors prove the ordering logic, not that
  a model puts a question near its answer. That needs a live provider, so it
  is a manual check rather than part of `npm run test:ai`:

  ```bash
  GEMINI_API_KEY=… EMBEDDING_PROVIDER=gemini npm run ai:ingest
  ```

  The run prints a chunk count per document; every one should report
  embeddings written rather than "stored without embeddings". Then ask the
  assistant a policy question and confirm the answer cites retrieved
  knowledge. With Ollama instead, `ollama pull nomic-embed-text` first.

`test:ai:embedding` stubs `fetch`, so it pins how the provider builds a
request and handles each reply — not that Google still answers that way. The
shape *was* checked by hand against the live API (a 768-wide request returns
`embedding.values` with 768 numbers, at magnitude ~0.59 — unnormalised,
which is why the provider normalises). If Google changes it, this suite
stays green and ingestion is what fails; `embeddingProviders/gemini.ts` is
then the one file to fix.

**Cannot prove with an automated test, and why:**
- *"The assistant never states an invented price."* That's a claim about
  what a live language model chooses to say — inherently non-deterministic,
  and no mock can stand in for it (a scripted mock only proves the plumbing
  around it works, which is what `assistant.test.ts` actually tests). The
  real safety mechanism is architectural: the model is never given a price
  in its prompt or training to draw from — every number in `tools.ts`
  results comes from Postgres, so there's nothing for it to invent *from*
  for Droelma-specific data. Verifying the model's actual compliance with
  the system prompt's rules requires running it and reading its output —
  which needs a live Ollama server this sandbox doesn't have. See the
  manual checks below.

## Manual checks against a live Ollama server

These map directly to the six scenarios from the brief. Start Ollama and
the app (see the main completion report / README for exact commands), then:

```bash
# 1. Price of a real package — the reply should state the tool's exact figure
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"What'\''s the price of the Cultural Highlights of Western Bhutan package?"}' | jq

# 2. Price of something that doesn't exist — must NOT invent a number
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"What'\''s the price of the Grand Everest Base Camp Bhutan package?"}' | jq

# 3. Asking it to book — must NOT claim a booking happened
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"Can you book the Tshering Boutique Hotel for me for next week?"}' | jq

# 4. Info outside the database (e.g. visa policy) — must say it can't confirm
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"Exactly how much is the Sustainable Development Fee right now?"}' | jq

# 5. Conversation continuity — reuse the conversationId from the first response
CID=$(curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d '{"message":"I want to visit Bhutan."}' | jq -r .conversationId)
curl -s -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" \
  -d "{\"message\":\"I have 7 days.\",\"conversationId\":\"$CID\"}" | jq
# the reply should read as continuing the Bhutan trip, not starting over

# 6. Rate limiting — the 9th+ request within a minute should 429
for i in $(seq 1 10); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3000/api/chat \
    -H "Content-Type: application/json" -d "{\"message\":\"hello $i\"}"
done
```

For 1–4, read the actual reply text and judge it against
`src/lib/ai/systemPrompt.ts`'s rules — there's no automated assertion for
"did the model behave," only your own read of the output. If a reply ever
states a specific number for something no tool returned, that's a prompt
issue to iterate on, not a plumbing bug.
