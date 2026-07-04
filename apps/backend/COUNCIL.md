# AI Council pipeline

Multi-agent LinkedIn post generation: Writer → Reviewer → Editor → Media Creator → Media Reviewer.

Produces a reviewed post **and** one unbound AI feed image (3 credits). Autopilot uses the same path at 3 credits per post.

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

- **Text revision loop:** if reviewer `overall < COUNCIL_PASS_SCORE` (default 75), writer revises once (max `COUNCIL_MAX_TEXT_REVISIONS=1`).
- **Media phase:** Media Creator designs a freeform `imagePrompt` from post copy + profile brand colors + optional `mediaCustomPrompt`; Nano Banana renders the image; Media Reviewer QAs.
- **Media regen loop:** media reviewer may fail once (max `COUNCIL_MAX_MEDIA_REGENS=1`); each regen charges **2 credits** (`CreditTransactionType.media`).
- **Output:** creates `PostPackage` at enqueue, updates through pipeline, attaches `PostMedia` (`mediaType=generated`), final status `ready_for_approval`.
- **Credits:** handler charges 3 on success (`CreditTransactionType.council` or `autopilot`); media regen is charged during the orchestrator regen loop.

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
| `creditCost` | 3 for manual council and autopilot |
| `creditCharged` | Set after successful consume |
| `postPackageId` | Linked post |
| `progress` | Live step label for UI |
| `result` | `{ postPackageId, revisionCount, mediaRegenCount }` |
