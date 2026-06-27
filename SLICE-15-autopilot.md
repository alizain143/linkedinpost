# Slice 15 — Autopilot (config + cron)

**Status:** Complete  
**Phase:** Phase 5 — Autopilot & media

## Goal

Workspaces can enable autopilot via API. An hourly cron enqueues one AI Council job per due posting slot (10 credits), creating posts with `source=autopilot` and pre-filled `scheduledAt`. No auto-publish in v1.

## Dependencies

- Slice 10: AI Council job queue
- Slice 11: `scheduledAt` on posts
- Slice 13: Media in council pipeline
- Slice 14: `calendar-schedule.util` (local time → UTC)

## Prisma

Migration `20250702100000_add_autopilot_config`:

- `AutopilotConfig` model (one per workspace)
- `AutopilotFrequency` enum
- `CreditTransactionType.autopilot`

## API

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/v1/workspaces/:workspaceId/autopilot` | Config + `nextRunAt`, `status` |
| `PUT` | `/v1/workspaces/:workspaceId/autopilot` | Upsert config |
| `GET` | `/v1/workspaces/:workspaceId/autopilot/planned` | Upcoming autopilot posts |

Timezone uses workspace owner `User.timezone` (same as calendar).

### PUT body

```json
{
  "enabled": true,
  "contentProfileId": "uuid",
  "frequency": "three_per_week",
  "postingDays": [1, 3, 4, 5, 7],
  "postingTime": "09:00"
}
```

### GET response

```json
{
  "enabled": true,
  "frequency": "three_per_week",
  "postingDays": [1, 3, 4, 5, 7],
  "postingTime": "09:00",
  "contentProfileId": "...",
  "status": "active",
  "nextRunAt": "2026-06-30T13:00:00.000Z",
  "lastRunDateKey": "2026-06-27"
}
```

## Cron

`@Cron('0 * * * *')` hourly tick in `AutopilotTickJob`.

Due when:

1. `enabled`
2. Today's ISO weekday in `postingDays`
3. Current local hour matches `postingTime` hour
4. `lastRunDateKey !== today`

On successful enqueue: set `lastRunDateKey`, bump `lastPillarIndex`.

## Pipeline

Reuses council jobs (not quick-draft):

```
AutopilotTickJob
  → AutopilotTickService.processDueConfigs()
  → AutopilotDispatchService.dispatch()
  → CouncilJobService.enqueueCouncil({ source: autopilot, scheduledAt, creditCost: 10 })
  → CouncilJobHandler → CouncilOrchestrator (writer → reviewer → editor → media)
  → CreditsService.consume(10, autopilot) on success
```

## Credits

| Event | Credits | Ledger type |
|-------|---------|-------------|
| Manual council | 3 | `council` |
| Autopilot tick | 10 | `autopilot` |

Insufficient credits: log + skip (autopilot stays enabled).

## Progress

- [x] Prisma `AutopilotConfig` + migration
- [x] `GET` / `PUT` / `planned` API
- [x] Hourly cron + due logic + idempotency
- [x] Council integration (`source=autopilot`, 10 credits)
- [x] Tests + docs

## Out of scope

- Auto-publish without approval
- Pro plan gating
- Frontend Autopilot screen
- Email notifications
