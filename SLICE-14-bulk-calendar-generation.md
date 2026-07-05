# Slice 14 — Bulk calendar generation

**Status:** Complete  
**Phase:** Phase 5 — Autopilot & media (bulk calendar only)

## Goal

`POST /generate/calendar` runs an async job that plans 7 or 30 posting slots, generates text per slot via quick-draft, and creates `PostPackage` rows with `source=calendar`, `status=ready_for_approval`, and pre-filled `scheduledAt`.

## Dependencies

- Slice 04: read calendar API
- Slice 08: quick draft generator
- Slice 09: BullMQ job queue
- Slice 11: scheduling (posts move to `scheduled` after approval)

## Prisma

Migration `20250701100000_add_calendar_generation_job_type`:

- `GenerationJobType.calendar`
- `CreditTransactionType.calendar`

## API

| Method | Route | Credits | Response |
|--------|-------|---------|----------|
| `POST` | `/v1/workspaces/:workspaceId/generate/calendar` | 7–90 credits (see pricing) | `202` + job |

### Request body

```json
{
  "durationDays": 7,
  "slotGenerationMode": "quick_draft",
  "contentProfileId": "uuid",
  "startDate": "2026-07-01",
  "postingTime": "09:00",
  "postingDays": [1, 2, 3, 4, 5],
  "additionalContext": "Focus on founder lessons"
}
```

`slotGenerationMode`: `quick_draft` (default, text only) or `council` (reviewed post + image per slot).

### Credit pricing (per slot)

| Duration | Text only (`quick_draft`) | AI Council (`council`) |
|----------|---------------------------|-------------------------|
| 7-day | 7 credits (1/post) | 21 credits (3/post) |
| 30-day | 30 credits (1/post) | 90 credits (3/post) |

### Job result

```json
{
  "durationDays": 7,
  "slotCount": 7,
  "postPackageIds": ["..."],
  "slots": [
    {
      "postPackageId": "...",
      "scheduledAt": "2026-07-01T13:00:00.000Z",
      "topic": "...",
      "pillar": "Founder lessons"
    }
  ]
}
```

Poll via `GET /v1/jobs/:id`.

## Pipeline

1. Planner LLM → slot topics per date
2. Per slot:
   - `quick_draft`: quick-draft-single → text-only post
   - `council`: inline council pipeline (writer → reviewer → editor → media) → post with image
3. Create `PostPackage` + v1 version (quick) or council-finalized post
4. Single credit charge on calendar job success

## Calendar visibility

Default `GET .../calendar` includes `ready_for_approval,scheduled,publishing,published,failed`. Bulk-generated posts appear on **All** and **Ready for Approval** filters.

## Progress

- [x] Prisma enums + migration
- [x] `calendar-generation` module + orchestrator
- [x] `POST /generate/calendar`
- [x] Credits per-slot (1 text / 3 council × duration)
- [x] `slotGenerationMode` quick_draft | council
- [x] Job progress + result mapping
- [x] Tests + docs

## Out of scope

- AI Council / media per calendar post
- Autopilot cron
- Calendar read API default status change
- Sync fallback without Redis

## Test plan

```bash
cd apps/backend && npm test && npm run build

POST /v1/workspaces/{wsId}/generate/calendar
GET  /v1/jobs/{jobId}
GET  /v1/workspaces/{wsId}/calendar?view=month&status=ready_for_approval
```
