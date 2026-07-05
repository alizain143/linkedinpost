# Generation module

AI generation pipeline for linkedinpost. Slice 07 = foundation; Slice 08 = HTTP + OpenAI + jobs; Slices 09–10 = async queue + AI Council.

Model choices: [`MODELS.md`](MODELS.md)  
Council pipeline: [`COUNCIL.md`](COUNCIL.md)

## HTTP API

| Method | Route | Cost | Mode |
|--------|-------|------|------|
| `POST` | `/v1/workspaces/:workspaceId/generate/quick` | 1 credit | Sync (200) |
| `POST` | `/v1/workspaces/:workspaceId/generate/quick-single` | 1 credit | Sync (200) — one variant / regen with optional prompt |
| `POST` | `/v1/workspaces/:workspaceId/generate/suggest-topics` | Free | Sync (200) — 5–8 topic ideas |
| `POST` | `/v1/workspaces/:workspaceId/generate/compare-pick` | Free | Sync (200) — pick best draft option |
| `POST` | `/v1/workspaces/:workspaceId/generate/council` | 3 credits | Async (202) — post + unbound image |
| `POST` | `/v1/workspaces/:workspaceId/generate/calendar` | 7–90 credits (1 or 3 per slot × duration) | Async (202) — `slotGenerationMode`: `quick_draft` \| `council` |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/apply-changes` | 1 credit | Sync (200) — revise post from feedback / optional prompt |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/generate-media` | 2 credits | Async (202) — body `{ mediaCustomPrompt?, replace? }` |
| `GET` | `/v1/workspaces/:workspaceId/autopilot` | — | Config + next run |
| `PUT` | `/v1/workspaces/:workspaceId/autopilot` | — | Upsert autopilot config |
| `GET` | `/v1/workspaces/:workspaceId/autopilot/planned` | — | Upcoming autopilot posts |
| `GET` | `/v1/jobs/:id` | — | Poll progress |

Guards: `ClerkAuthGuard` + `CreditsGuard` on quick draft and council only. Calendar asserts per-slot bundle cost in `CalendarJobService` before enqueue (7/30 text, 21/90 council).

### Example

```bash
POST /v1/workspaces/{wsId}/generate/quick
POST /v1/workspaces/{wsId}/generate/suggest-topics
POST /v1/workspaces/{wsId}/generate/council
POST /v1/workspaces/{wsId}/generate/calendar
POST /v1/workspaces/{wsId}/posts/{postId}/generate-media
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

**Quick-single / regenerate:** `POST /generate/quick-single` accepts optional `previousVariant` (draft being replaced) and `avoidVariants` (sibling drafts or prior versions the model must not repeat). Prompts require fresh hook/body/CTA/tags while keeping the same topic and voice; temperature 0.95.

**Apply-changes / post regen:** `ReviseDraftJobService` loads up to 8 stored `PostVersion` rows as `avoidVariants` so repeated regenerates do not cycle through old versions.

## Async job queue (Slice 09)

```
POST /generate/council
    → CouncilJobService.enqueueCouncil()
    → GenerationJob (pending) + PostPackage
    → BullMQ generation-jobs queue
    → GenerationJobProcessor (skips if `creditCharged` or `completed`; conditional claim)
    → CouncilJobHandler → CouncilOrchestrator.run(jobId) (progress only)
    → CouncilJobHandler charges credits + sets `completed` + `creditCharged`
```

## Media-only job (draft image)

```
POST /posts/:id/generate-media
    → MediaJobService.enqueueMedia()
    → GenerationJob (type=media, pending) on existing draft PostPackage
    → BullMQ generation-jobs queue
    → MediaJobHandler → MediaOnlyOrchestrator.run(jobId)
    → Post status: draft → media_generating → draft (with PostMedia attached)
    → MediaJobHandler charges credits (2 freestyle / 1 template)
```

Requires Redis. Blocks if post is not `draft`/`ready_for_approval` or already has media (unless `replace`).

**Lanes:** `mediaMode=freestyle` (default) uses Nano Banana. `mediaMode=template` resolves a `MediaTemplate` (post → profile → workspace → system identity-card), slot-fills headline/subhead via text LLM, renders SVG→PNG with Resvg. See [SLICE-22-media-templates.md](../../SLICE-22-media-templates.md).


## Autopilot (Slice 15)

Autopilot reuses council jobs — no new `GenerationJobType`.

```
Hourly cron (AutopilotTickJob)
    → AutopilotDispatchService.dispatch()
    → CouncilJobService.enqueueCouncil({ source: autopilot, scheduledAt, creditCost: 3 })
    → CouncilJobHandler → CouncilOrchestrator (full pipeline + unbound image)
    → CreditsService.consume(3, autopilot, { generationJobId }) on success
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

Registry keys: `quick-draft` v1, `quick-draft-single` v1 (calendar slots), `council-writer`, `council-reviewer`, `council-editor`, `council-media-creator`, `council-media-reviewer` v1, `calendar-planner` v1.

### Prompt design (token efficiency)

- **System prompts** hold role, LinkedIn constraints, JSON schema, and rubrics (stable across calls).
- **User prompts** use compact `<profile>`, `<brief>`, `<request>`, `<post>` blocks — not labeled prose lines.
- **Field budgets** in `PromptRenderer`: writing sample 400 chars, brief/context 600 chars, offer 200 chars, avoid-words 150 chars.
- **Council `priorSteps`** are projected per agent (`prior-steps-projector.ts`) and serialized compactly (no pretty-print).
- **Calendar slots** use `quick-draft-single` (1 post) instead of `quick-draft` (3 variants) to cut output tokens.
- **Image generation** composes `headlineText` + `styleNotes` + visual `imagePrompt` in `GoogleImageGenerationProvider.buildPrompt()`.
- **Carousel** (`mediaFormat: carousel`): AI picks slide count (3–10) or user override via `carouselSlideCount`. Template lane uses `TemplateCarouselRenderService` + carousel slot-fill LLM; freestyle lane uses `FreestyleCarouselRenderService`. Credits: **2 per slide**. Multiple `PostMedia` rows attached with `sortOrder`; LinkedIn publish uses `multiImage` when 2+ slides.
- **Reviewer threshold** uses `{{council.passScore}}` from orchestrator (75 standard, 90 premium).

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
- `TopicSuggestionsGenerator`
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
