# FE-Slice 10 — LinkedIn connection (real API)

**Status:** Complete (updated for per-workspace direct OAuth)  
**Depends on:** FE-SLICE-01

## Goal

Wire LinkedIn connection display and gating to the backend API. **Connect flow uses direct LinkedIn OAuth per workspace** (not Clerk `createExternalAccount`) so agency users can bind a different LinkedIn profile to each workspace.

See [apps/backend/LINKEDIN-OAUTH.md](apps/backend/LINKEDIN-OAUTH.md) for full architecture.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/linkedin/oauth/start` |
| `GET` | `/v1/workspaces/:workspaceId/linkedin/connection` |
| `DELETE` | `/v1/workspaces/:workspaceId/linkedin/connection` |
| `GET` | `/v1/workspaces/:workspaceId/linkedin/profile` |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/sync` |

## Delivered

### API layer

- [`lib/api/types/linkedin.ts`](apps/web/src/lib/api/types/linkedin.ts)
- [`lib/api/linkedin.ts`](apps/web/src/lib/api/linkedin.ts) — includes `startLinkedInOAuth`
- [`lib/linkedin-utils.ts`](apps/web/src/lib/linkedin-utils.ts) — connection state helpers
- [`lib/linkedin-connect-context.ts`](apps/web/src/lib/linkedin-connect-context.ts) — workspace id in session during OAuth

### Hooks

- [`use-linkedin-api.ts`](apps/web/src/hooks/api/use-linkedin-api.ts) — workspace-scoped connection, disconnect, profile sync

### App integration

- [`app-ui-provider.tsx`](apps/web/src/providers/app-ui-provider.tsx) — `startLinkedInOAuth` redirect; clears binding before reconnect; workspace-scoped connection state
- [`linkedin-callback-handler.tsx`](apps/web/src/components/app/linkedin-callback-handler.tsx) — invalidates queries after `?linkedin=connected`
- [`connect-linkedin-modal.tsx`](apps/web/src/components/modals/connect-linkedin-modal.tsx) — per-workspace copy; link to sign out of LinkedIn for account switch

### Surfaces

- [`Dashboard.tsx`](apps/web/src/components/sections/app/dashboard/Dashboard.tsx) — connect banners
- [`Settings.tsx`](apps/web/src/components/sections/app/settings/Settings.tsx) — status, Switch account, Disconnect
- [`app-topbar.tsx`](apps/web/src/components/app/app-topbar.tsx) — connection badge

## Behaviors

- Connection state is **per active workspace** (`useLinkedInConnection(activeWorkspaceId)`)
- Connect always runs OAuth; clears existing workspace binding first when reconnecting
- Switching workspaces updates LinkedIn status in UI without cross-workspace leakage
- Clerk is **not** used for workspace connect (Clerk limited to one LinkedIn per user)
- `LINKEDIN_NOT_CONNECTED` surfaced via `api-error-messages.ts`

## Progress

- [x] Per-workspace OAuth start + callback handling
- [x] Workspace-scoped connection queries
- [x] Connect modal + Settings switch/disconnect
- [x] Agency multi-profile connect verified manually

## Test plan (manual)

- [ ] Personal workspace: connect your LinkedIn → publish ready
- [ ] Client workspace: connect different LinkedIn → shows separate profile name
- [ ] Switch workspace in switcher → each shows correct connection state
- [ ] Switch account: disconnects old binding, OAuth, new profile bound
- [ ] Sign out of LinkedIn (modal link) → connect picks different browser session
- [ ] Schedule/publish uses correct workspace profile

## Out of scope

- Encrypting tokens at rest (future hardening)
- LinkedIn logout-then-oauth automatic chain (LinkedIn has no return URL)
