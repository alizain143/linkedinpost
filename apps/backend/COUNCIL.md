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
- **Media regen loop:** media reviewer may fail once (max `COUNCIL_MAX_MEDIA_REGENS=1`); each regen charges **5 credits** (`CreditTransactionType.media`)
- **Output:** creates `PostPackage` at enqueue, updates through pipeline, final status `ready_for_approval`
- **Credits:** 3 on success (`CreditTransactionType.council`); media regens billed separately

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

One **`GenerationJob`** (`type=council`) is the council execution unit:

| Field | Purpose |
|-------|---------|
| `revisionCount` | Text revision loops completed |
| `mediaRegenCount` | Media regen loops completed |
| `finalScore` | Reviewer overall score at completion |
| `progress` | Polling UI step state |
| `councilEvents[]` | Append-only timeline per agent step |

`CouncilEvent` rows reference `generationJobId` (not a separate run table).

`PostMedia` optionally references `generationJobId` for the job that produced the asset.

The council history API (`GET .../posts/:postId/council`) maps council jobs to the existing `runs[]` response shape for backward compatibility (`id` = job id).

## Tests

```bash
npm test -- --testPathPattern=council
npm test -- --testPathPattern=job-queue
```
