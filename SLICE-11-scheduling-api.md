# Slice 11 — Scheduling API

**Status:** Complete  
**Phase:** Phase 4 — LinkedIn publish (scheduling only)

## Goal

Dedicated semantic scheduling endpoints: schedule, reschedule, cancel, and list upcoming posts. Builds on existing `PostPackage.scheduledAt` and calendar views.

## Dependencies

- Slice 02: `PostPackage.scheduledAt`
- Slice 03: status transitions (`approved` → `scheduled`)
- Slice 05: approvals (`approved` posts)

## Prisma

No migration — `scheduledAt` and `scheduled` status already exist.

## API

| Method | Route | From status | Action |
|--------|-------|-------------|--------|
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/schedule` | `approved` | Schedule |
| `PATCH` | `/v1/workspaces/:workspaceId/posts/:id/schedule` | `scheduled` | Reschedule |
| `DELETE` | `/v1/workspaces/:workspaceId/posts/:id/schedule` | `scheduled` | Cancel → `approved` |
| `GET` | `/v1/workspaces/:workspaceId/scheduled` | — | Upcoming list |

### Request body

```json
{ "scheduledAt": "2026-07-15T14:00:00.000Z" }
```

### Validation

| Rule | Code | Default |
|------|------|---------|
| Required | `SCHEDULED_AT_REQUIRED` | — |
| Future | `VALIDATION_ERROR` | — |
| Min lead time | `SCHEDULE_TOO_SOON` | 15 minutes |
| Max horizon | `SCHEDULE_TOO_FAR` | 90 days |

## Env

```env
SCHEDULE_MIN_LEAD_MINUTES=15
SCHEDULE_MAX_DAYS=90
```

## Progress

- [x] `scheduling.validation.ts` + config
- [x] `SchedulingService` + status transitions
- [x] Semantic schedule/reschedule/cancel endpoints
- [x] `GET /scheduled` list
- [x] Extend `ALLOWED_TRANSITIONS` (`scheduled` → `approved`)
- [x] Refactor `PostsService` to shared validator
- [x] Unit tests + docs

## Out of scope

- LinkedIn OAuth (Slice 12)
- `POST /publish` and publish-at-time BullMQ job
- LinkedIn connection gate on schedule

## Test plan

```bash
cd apps/backend && npm test && npm run build

POST   /v1/workspaces/{wsId}/posts/{id}/schedule
PATCH  /v1/workspaces/{wsId}/posts/{id}/schedule
DELETE /v1/workspaces/{wsId}/posts/{id}/schedule
GET    /v1/workspaces/{wsId}/scheduled
```

Legacy `PATCH .../posts/:id/status { status: scheduled }` still works.
