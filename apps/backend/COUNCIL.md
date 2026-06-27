# AI Council pipeline

Multi-agent LinkedIn post generation: Writer → Reviewer → Editor → Media Creator → Media Reviewer.

## HTTP API

| Method | Route | Cost | Response |
|--------|-------|------|----------|
| `POST` | `/v1/workspaces/:workspaceId/generate/council` | 3 credits | **202** + `jobId` |
| `GET` | `/v1/jobs/:id` | — | Job + `progress` + `events[]` |
| `GET` | `/v1/workspaces/:workspaceId/posts/:postId/council` | — | Full run history |

Requires **Redis** (`REDIS_URL`). Without Redis, council POST returns `503 REDIS_UNAVAILABLE`.

## Polling (live progress)

1. `POST /generate/council` → store `jobId` and `postPackageId`
2. Poll `GET /jobs/:jobId` every 2–3 seconds
3. Render `events[]` as timeline; show `progress.currentLabel` as active step
4. Stop when `status` is `completed` or `failed`

## Pipeline

- **Text revision loop:** if reviewer `overall < COUNCIL_PASS_SCORE` (default 75), writer revises once (max `COUNCIL_MAX_TEXT_REVISIONS=1`)
- **Media regen loop:** stub media reviewer may fail once (max `COUNCIL_MAX_MEDIA_REGENS=1`)
- **Output:** creates `PostPackage` at enqueue, updates through pipeline, final status `ready_for_approval`
- **Credits:** 3 on success only (`CreditTransactionType.council`)

## Env

```env
REDIS_URL=redis://localhost:6379
GENERATION_QUEUE_CONCURRENCY=2
COUNCIL_PASS_SCORE=75
COUNCIL_MAX_TEXT_REVISIONS=1
COUNCIL_MAX_MEDIA_REGENS=1
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-5.4
```

## Data model

- `CouncilRun` — one execution per job
- `CouncilEvent` — append-only timeline per agent step
- `GenerationJob` — async job tracking with `progress` JSON

Media generation is **stubbed** in v1 (Phase 5 adds real images).

## Tests

```bash
npm test -- --testPathPattern=council
npm test -- --testPathPattern=job-queue
```
