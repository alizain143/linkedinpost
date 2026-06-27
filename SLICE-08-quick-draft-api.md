# Slice 08 — Quick Draft API

**Status:** Complete  
**Phase:** Phase 3 — Generation

## Goal

User-facing quick draft generation: OpenAI text completion, `GenerationJob` persistence, credit deduct on success.

## Dependencies

- Slice 07: generation foundation (context, prompts, parser, `QuickDraftGenerator`)
- Slice 06: `CreditsGuard`, `CreditsService.consume()`

## Prisma

- `GenerationJob` model + `GenerationJobStatus`, `GenerationJobType` enums
- Migration: `20250628100000_add_generation_jobs`

## API

| Method | Route | Guards | Cost |
|--------|-------|--------|------|
| `POST` | `/v1/workspaces/:workspaceId/generate/quick` | Clerk + Credits | 1 credit |
| `GET` | `/v1/jobs/:id` | Clerk | — |

### Request body (`POST .../generate/quick`)

```json
{
  "topic": "Shipping weekly as a founder",
  "postType": "personal_story",
  "tone": "Bold",
  "pillar": "Founder lessons",
  "contentProfileId": "optional-uuid",
  "additionalContext": "optional"
}
```

### Response

`GenerationJob` with `status: completed` and `result.variants` (3 items) on success. Variants are **not** auto-saved to `PostPackage`.

## Env

```env
OPENAI_API_KEY=sk-...
OPENAI_TEXT_MODEL=gpt-5.4
```

Without `OPENAI_API_KEY`, dev uses `MockTextCompletionProvider` via `ConfigModelRouter`.

## Model choice

- **Text:** GPT-5.4 standard (not Pro) — see [`apps/backend/MODELS.md`](apps/backend/MODELS.md)
- **Images:** Phase 5 (Nano Banana 2 / Imagen 4)

## Progress

- [x] Prisma `GenerationJob` migration
- [x] `OpenAiTextCompletionProvider` + `ConfigModelRouter`
- [x] `QuickDraftJobService` (job lifecycle + credit consume)
- [x] `POST /generate/quick` + `GET /jobs/:id`
- [x] Unit tests (provider, job service, controllers)
- [x] Docs + PRODUCT_OVERVIEW

## Out of scope

- Auto-save variants to drafts
- Redis/Bull async queue → [SLICE-09](SLICE-09-async-job-queue.md)
- AI Council, media generation → [SLICE-10](SLICE-10-ai-council.md)

## Test plan

```bash
cd apps/backend && npm test && npm run build

POST /v1/workspaces/{wsId}/generate/quick
GET  /v1/jobs/{jobId}
GET  /v1/credits
```
