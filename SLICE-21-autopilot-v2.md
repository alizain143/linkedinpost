# Slice 21 — Autopilot v2 (metrics, approval mode, day profiles)

**Status:** Complete  
**Phase:** Phase 5 — Autopilot & media

## Goal

Fix misleading autopilot status metrics, add approval mode (require approval vs auto-schedule to LinkedIn), and support per-day content profile overrides.

## Dependencies

- Slice 15: Autopilot config + cron
- Slice 11/12: Scheduling + LinkedIn publish

## Prisma

Migration `20250710100000_autopilot_v2`:

- `AutopilotApprovalMode` enum: `require_approval`, `auto_schedule`
- `AutopilotConfig.approvalMode` (default `require_approval`)
- `AutopilotConfig.dayProfileOverrides` (JSON: ISO weekday → content profile UUID)

## API changes

### GET `/v1/workspaces/:workspaceId/autopilot`

New response fields:

- `timezone` — workspace owner timezone
- `nextGenerationState` — `due_now | scheduled | paused`
- `nextPlannedSlot` — next posting slot from schedule (even if no post exists)
- `approvalMode`
- `dayProfileOverrides`

### PUT body (additions)

```json
{
  "approvalMode": "auto_schedule",
  "dayProfileOverrides": { "1": "uuid", "3": "uuid" }
}
```

### GET planned posts

Each item includes `publishState`: `awaiting_approval | approved | scheduled_for_linkedin`

## Behavior

### Next generation

- `due_now` when cron is overdue for today's slot (even if posting time already passed)
- `scheduled` for next future slot
- `paused` when autopilot disabled

### Approval mode

- `require_approval` — council completes → `ready_for_approval` (unchanged)
- `auto_schedule` — after council success, system approves + schedules + enqueues publish job
  - Requires LinkedIn connected with publish scope on enable
  - If slot passed, bumps to `now + minLeadMinutes`

### Day profile overrides

- Default: `contentProfileId` → workspace default profile → oldest profile
- Per weekday override in `dayProfileOverrides` for dispatch only

### Council failure retry

- On autopilot council job failure, `lastRunDateKey` reset to allow same-day retry

## Progress

- [x] Metric fixes (`computeNextGenerationAt`, timezone in API)
- [x] Cron reverted to hourly
- [x] Approval mode + auto-schedule hook
- [x] Day profile overrides
- [x] Frontend UX
- [x] Tests + docs
