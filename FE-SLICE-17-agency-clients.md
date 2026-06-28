# FE-Slice 17 — Agency client workspaces

**Status:** Complete  
**Depends on:** FE-SLICE-01, FE-SLICE-03

## Goal

Wire `/app/clients` to workspace APIs: list client workspaces with stats, create (max 5), delete with cascade, open/switch workspace context, and Agency plan gating.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces` |
| `GET` | `/v1/workspaces/:workspaceId` |
| `POST` | `/v1/workspaces` |
| `DELETE` | `/v1/workspaces/:workspaceId` |

Maps to backend SLICE-19.

## Delivered

### API layer

- Extended [`lib/api/types/workspace.ts`](apps/web/src/lib/api/types/workspace.ts) — create/update/delete bodies
- Extended [`lib/api/workspaces.ts`](apps/web/src/lib/api/workspaces.ts) — client workspace mutations
- [`lib/client-workspace-utils.ts`](apps/web/src/lib/client-workspace-utils.ts) — plan gate, filters, avatar helpers

### Hooks

- Extended [`use-workspaces-api.ts`](apps/web/src/hooks/api/use-workspaces-api.ts) — `useClientWorkspaces`, `useClientWorkspaceDetails`, create/delete mutations

### UI

- [`Clients.tsx`](apps/web/src/components/sections/app/clients/Clients.tsx) — full rewrite
- [`ClientWorkspaceCard.tsx`](apps/web/src/components/sections/app/clients/ClientWorkspaceCard.tsx)
- [`AddClientModal.tsx`](apps/web/src/components/sections/app/clients/AddClientModal.tsx)
- [`confirmRemoveClient`](apps/web/src/providers/app-ui-provider.tsx) accepts `onConfirm` callback

## Behaviors

- Agency-only gate with upgrade banner for non-agency plans
- Up to 5 client workspaces with stats from detail API
- Create switches to new client workspace
- Open switches context and navigates to dashboard
- Delete cascades; falls back to personal workspace if active client deleted
- Sidebar workspace switcher picks up new clients via list invalidation

## Progress

- [x] Workspace types + fetch + utils
- [x] Hooks + mutations
- [x] Clients page + modal + cards
- [x] Workspace switch/delete integration
- [x] Error messages
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Agency user lists/creates/opens/deletes clients
- [ ] 6th create shows `CLIENT_WORKSPACE_LIMIT`
- [ ] Non-agency user sees upgrade gate
- [ ] Delete active client falls back to personal workspace

## Out of scope

- Team invites, restore API, rename UI, per-workspace LinkedIn
