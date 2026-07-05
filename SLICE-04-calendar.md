# Slice 04 — Calendar API (Month / Week / List)

**Status:** Complete  
**Phase:** Phase 2 — Workflow (no AI)

## Goal

Read-only calendar endpoints over `PostPackage.scheduledAt` for month, week, and list views. Timezone bucketing uses the authenticated user's IANA timezone.

## Dependencies

- Slice 02: `PostPackage.scheduledAt`
- Slice 03: status transition sets `scheduledAt` when scheduling

## Prisma

- Index: `@@index([workspaceId, scheduledAt])`
- Migration: `20250627210000_add_post_package_scheduled_at_index`

## API

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/calendar` |

### Query

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `view` | `month` \| `week` \| `list` | required | |
| `date` | ISO date string | today | Anchor for month/week; list window center |
| `status` | comma-separated `PostPackageStatus` | ready_for_approval,scheduled,publishing,published,failed | |
| `limit` | int | 50 (list only) | Max 100 |

Timezone: user's `User.timezone` (fallback `America/New_York`).

## Progress

- [x] Prisma index migration
- [x] `calendar-date.util` + tests
- [x] `CalendarService` + tests
- [x] `CalendarController` + Swagger
- [x] `CalendarModule` in AppModule
- [x] PRODUCT_OVERVIEW checkboxes

## Out of scope

Reschedule API (use scheduling endpoints), `CalendarEntry` model, bulk generation (see [SLICE-14](SLICE-14-bulk-calendar-generation.md)), approvals, frontend

## Test plan

```bash
GET /v1/workspaces/$WS/calendar?view=month&date=2026-06-15
GET /v1/workspaces/$WS/calendar?view=week
GET /v1/workspaces/$WS/calendar?view=list&limit=20
```

Unit tests: `calendar-date.util.spec.ts`, `calendar.service.spec.ts`
