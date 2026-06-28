# FE-Slice 15 — Autopilot config + planned posts

**Status:** Complete  
**Depends on:** FE-SLICE-03, FE-SLICE-06

## Goal

Wire `/app/autopilot` and the dashboard autopilot card to real APIs: config CRUD, planned posts list, Pro+ plan gating, and live status metrics.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/autopilot` |
| `PUT` | `/v1/workspaces/:workspaceId/autopilot` |
| `GET` | `/v1/workspaces/:workspaceId/autopilot/planned` |

Maps to backend SLICE-15.

## Delivered

### API layer

- [`lib/api/types/autopilot.ts`](apps/web/src/lib/api/types/autopilot.ts) — `ApiAutopilotConfig`, `UpsertAutopilotConfigBody`
- [`lib/api/autopilot.ts`](apps/web/src/lib/api/autopilot.ts) — fetch config, upsert, planned posts
- [`lib/autopilot-utils.ts`](apps/web/src/lib/autopilot-utils.ts) — presets, plan gate, formatters

### Hooks

- [`use-autopilot-api.ts`](apps/web/src/hooks/api/use-autopilot-api.ts) — config, planned, upsert mutation

### UI

- [`Autopilot.tsx`](apps/web/src/components/sections/app/autopilot/Autopilot.tsx) — full rewrite (schedule form, profile, toggle, planned list)
- [`AutopilotStatusSummary.tsx`](apps/web/src/components/sections/app/autopilot/AutopilotStatusSummary.tsx) — shared status metrics
- [`Dashboard.tsx`](apps/web/src/components/sections/app/dashboard/Dashboard.tsx) — live autopilot card

## Behaviors

- Posting presets (3×/week, daily, weekdays, weekly) + custom weekday pills
- Posting time + read-only timezone hint (owner account timezone)
- Content profile select; 10 credits per autopilot post (AI Council)
- Enable/pause with confirm dialog on pause; Pro/Agency plan gate
- Planned posts link to `/app/posts/:id`
- `PLAN_UPGRADE_REQUIRED` uses API message with generic fallback; calendar keeps custom fallback

## Progress

- [x] Autopilot types + fetch + utils
- [x] Hooks + query keys
- [x] Autopilot page + dashboard card
- [x] Error messages + credit constant
- [x] `npm run build` passes

## Test plan (manual)

- [ ] `/app/autopilot` loads config for active workspace
- [ ] Toggle on (Pro): Active status, `nextRunAt` shown
- [ ] Toggle on (Free): blocked; server rejects if bypassed
- [ ] Pause confirm; schedule save persists
- [ ] Planned posts list with correct dates
- [ ] Dashboard card shows live data

## Out of scope

- Cron/tick internals
- Content strategy fields not in API (goal, media preference, post-type mix)
