# Scheduling module

Schedule approved posts for future publishing. See [SLICE-11-scheduling-api.md](../../SLICE-11-scheduling-api.md).

## HTTP API

| Method | Route | Description |
|--------|-------|-------------|
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/schedule` | `approved` → `scheduled` |
| `PATCH` | `/v1/workspaces/:workspaceId/posts/:id/schedule` | Reschedule (stay `scheduled`) |
| `DELETE` | `/v1/workspaces/:workspaceId/posts/:id/schedule` | Cancel → `approved`, clear `scheduledAt` |
| `GET` | `/v1/workspaces/:workspaceId/scheduled` | Upcoming posts, `scheduledAt ASC` |

Guards: `ClerkAuthGuard` only (no credits).

## Workflow

```
ready_for_approval → approve → approved → POST /schedule → scheduled
scheduled → PATCH /schedule (new time)
scheduled → DELETE /schedule → approved
```

`SchedulingService` calls `assertRedisAvailable()` before persisting `scheduled` status. Schedule/unschedule via legacy `PATCH .../status` is blocked — use these routes.

Published posts appear on the calendar by `publishedAt` when `scheduledAt` was cleared at publish time.

## Validation

Shared [`scheduling.validation.ts`](src/modules/scheduling/scheduling.validation.ts) used by both `SchedulingService` and legacy `PATCH .../status`.

| Env | Default |
|-----|---------|
| `SCHEDULE_MIN_LEAD_MINUTES` | 15 |
| `SCHEDULE_MAX_DAYS` | 90 |

Times are stored as UTC (`timestamptz`). Display using `User.timezone` (same as calendar).

## Related endpoints

| Endpoint | Use |
|----------|-----|
| `GET /calendar` | Month/week/list calendar views |
| `GET /posts?status=scheduled` | Filter by status (any time) |
| `PATCH /posts/:id/status` | Legacy generic transitions |

## Tests

```bash
npm test -- --testPathPattern=scheduling
```

## Next (Slice 12 — done)

LinkedIn OAuth via Clerk, `POST /publish`, BullMQ job at `scheduledAt` → `publishing` → `published`. See [PUBLISHING.md](PUBLISHING.md).
