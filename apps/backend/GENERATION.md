# Generation module

AI generation pipeline for linkedinpost. Slice 07 = foundation; Slice 08 = HTTP + OpenAI + jobs; Slices 09–10 = async queue + AI Council.

Model choices: [`MODELS.md`](MODELS.md)  
Council pipeline: [`COUNCIL.md`](COUNCIL.md)

## HTTP API

| Method | Route | Cost | Mode |
|--------|-------|------|------|
| `POST` | `/v1/workspaces/:workspaceId/generate/quick` | 1 credit | Sync (200) |
| `POST` | `/v1/workspaces/:workspaceId/generate/council` | 3 credits | Async (202) |
| `POST` | `/v1/workspaces/:workspaceId/generate/calendar` | 10 / 30 credits | Async (202) |
| `GET` | `/v1/workspaces/:workspaceId/autopilot` | — | Config + next run |
| `PUT` | `/v1/workspaces/:workspaceId/autopilot` | — | Upsert autopilot config |
| `GET` | `/v1/workspaces/:workspaceId/autopilot/planned` | — | Upcoming autopilot posts |
| `GET` | `/v1/jobs/:id` | — | Poll progress |

Guards: `ClerkAuthGuard` + `CreditsGuard` on generation endpoints.

### Example

```bash
POST /v1/workspaces/{wsId}/generate/quick
POST /v1/workspaces/{wsId}/generate/council
POST /v1/workspaces/{wsId}/generate/calendar
GET  /v1/jobs/{jobId}
GET  /v1/workspaces/{wsId}/posts/{postId}/council
```

Quick draft variants return in `job.result.variants` (3 items). Not auto-saved to `PostPackage`.

Council creates a `PostPackage` and returns `postPackageId` immediately; poll `GET /jobs/:id` for timeline `events[]`.

## Env

```env
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-5.4
REDIS_URL=redis://localhost:6379
GENERATION_QUEUE_CONCURRENCY=2
```

Without `OPENAI_API_KEY`, `ConfigModelRouter` falls back to `MockTextCompletionProvider`.

Without `REDIS_URL`, quick draft still works; council, calendar, and autopilot cron dispatch return `503` or skip.

## Quick Draft flow

```
QuickDraftRequestDto
    → QuickDraftJobService (create GenerationJob)
    → ContextAssembler
    → PromptRenderer (quick-draft v1)
    → ConfigModelRouter.text().complete()
    → QuickDraftOutputParser
    → CreditsService.consume({ generationJobId }) on success
    → GenerationJob completed + result JSON
```

## Async job queue (Slice 09)

```
POST /generate/council
    → CouncilJobService.enqueueCouncil()
    → GenerationJob (pending) + PostPackage
    → BullMQ generation-jobs queue
    → GenerationJobProcessor
    → CouncilJobHandler → CouncilOrchestrator.run(jobId)
    → CouncilEvent timeline + job progress updates
    → CreditsService.consume(3, council, { generationJobId }) on success
```

## Autopilot (Slice 15)

Autopilot reuses council jobs — no new `GenerationJobType`.

```
Hourly cron (AutopilotTickJob)
    → AutopilotDispatchService.dispatch()
    → CouncilJobService.enqueueCouncil({ source: autopilot, scheduledAt, creditCost: 10 })
    → CouncilJobHandler → CouncilOrchestrator (full pipeline + media)
    → CreditsService.consume(10, autopilot, { generationJobId }) on success
```

Config API: `GET` / `PUT` `/v1/workspaces/:workspaceId/autopilot`, planned posts at `.../autopilot/planned`.

Autopilot schedule is stored as `postingDays` (ISO weekday ints) + `postingTime` (HH:mm). The API may accept a `postingPreset` helper that maps to days but does not persist a separate frequency column.

## Job states

| Status | Meaning |
|--------|---------|
| `pending` | Created / queued |
| `running` | Worker processing |
| `completed` | Result ready; credit charged |
| `failed` | `errorCode` set; no credit charge |

Council jobs include `progress`, `postPackageId`, council fields (`revisionCount`, `mediaRegenCount`, `finalScore`), and `events[]`.

## Context providers

Providers run in `order` ascending:

| Order | Provider | Output slice |
|------:|----------|--------------|
| 10 | `UserContextProvider` | `user` |
| 20 | `ContentProfileContextProvider` | `contentProfile`, `contentProfileId` |
| 30 | `GenerationInputContextProvider` | `input` |
| 40 | `DocumentContextProvider` | `documents` |

Council agents also receive `priorSteps` in rendered prompts.

## Prompts

Registry keys: `quick-draft` v1, `council-writer`, `council-reviewer`, `council-editor`, `council-media-creator`, `council-media-reviewer` v1.

## LLM layer

| Class | Role |
|-------|------|
| `ConfigModelRouter` | OpenAI when key set, else mock |
| `OpenAiTextCompletionProvider` | GPT-5.4 via OpenAI SDK |
| `MockTextCompletionProvider` | Dev/test without API key |
| `MockImageGenerationProvider` | Mock PNG when `MEDIA_GENERATION_MOCK=true` or no Google creds |
| `GoogleImageGenerationProvider` | Nano Banana 2 via `@google/genai` (Slice 17) |
| `ModelRouter.image()` | Mock or Google based on env |

## Errors

| Code | HTTP |
|------|------|
| `GENERATION_CONTEXT_ERROR` | 400 |
| `GENERATION_PARSE_ERROR` | 422 |
| `LLM_PROVIDER_ERROR` | 502 |
| `CREDITS_EXHAUSTED` | 402 |
| `REDIS_UNAVAILABLE` | 503 |
| `RESOURCE_NOT_FOUND` | 404 |

## Exports

`GenerationModule` exports:

- `QuickDraftGenerator`
- `QuickDraftJobService`
- `ContextAssembler`
- `PromptRenderer`
- `GenerationJobsQueryService`

## Tests

```bash
npm test -- --testPathPattern=generation
npm test -- --testPathPattern=council
npm test -- --testPathPattern=job-queue
```
