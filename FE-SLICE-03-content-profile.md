# FE-Slice 03 — Workspaces + Content Profile

**Status:** Complete  
**Depends on:** FE-SLICE-01, FE-SLICE-02

## Goal

Content profile CRUD at `/app/profile`, scoped to the active workspace. Pillar editing, default profile selection, empty state, and agency workspace context.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET/POST/PATCH/DELETE` | `/v1/workspaces/:workspaceId/content-profiles` |
| `GET` | `/v1/workspaces/:workspaceId/content-profiles/:id` |

Maps to backend SLICE-01 (`content-profiles` module).

## Delivered

### API layer

- [`lib/api/types/content-profile.ts`](apps/web/src/lib/api/types/content-profile.ts) — `ApiContentProfile`, create/update bodies
- [`lib/api/types/enums.ts`](apps/web/src/lib/api/types/enums.ts) — `ContentGoal` enum
- [`lib/content-goals.ts`](apps/web/src/lib/content-goals.ts) — API value → UI label mapping
- [`lib/api/content-profiles.ts`](apps/web/src/lib/api/content-profiles.ts) — list, get, create, update, delete
- [`lib/api/query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — `contentProfiles.list` / `detail`

### Hooks

- [`use-content-profiles-api.ts`](apps/web/src/hooks/api/use-content-profiles-api.ts) — `useContentProfiles`, create/update/delete mutations with cache invalidation

### Profile page (`/app/profile`)

- [`Profile.tsx`](apps/web/src/components/sections/app/profile/Profile.tsx) — full CRUD UI wired to active workspace
- Profile selector with default badge; create/edit modes
- Pillar editor (add/remove pills; full replace on save)
- Default profile toggle (`isDefault`)
- Empty state when workspace has no profiles
- Client workspace context label for agency workspaces
- Live voice preview from form fields
- `QueryState` loading/error + retry

### App UI

- [`app-ui-provider.tsx`](apps/web/src/providers/app-ui-provider.tsx) — `confirmDeleteContentProfile(name, onConfirm)`

## Behaviors

- List order from API: default first, then `createdAt` asc
- Saving sends full `pillars[]` (backend replace-on-update)
- Deleting default profile promotes oldest remaining profile to default (backend)
- Workspace switch reloads profiles for new workspace

## Progress

- [x] Content profile types + fetch functions
- [x] TanStack Query hooks
- [x] Profile page wired
- [x] Delete confirmation dialog
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Create first profile in personal workspace
- [ ] Edit fields and pillars; save persists after refresh
- [ ] Create second profile; set as default; list shows default first
- [ ] Delete non-default profile
- [ ] Delete default profile; another becomes default
- [ ] Switch workspace via sidebar; profiles reload
- [ ] Client workspace shows workspace name in header
- [ ] API error shows toast; list error shows retry banner

## Out of scope

- Client workspace creation (FE-SLICE-17)
- Generate page content profile picker (FE-SLICE-12)
