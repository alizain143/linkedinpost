# FE-Slice 01 — API Foundation + Workspace Context

**Status:** Complete  
**Depends on:** Clerk auth (existing)

## Goal

Shared API infrastructure and active workspace context for all subsequent frontend slices.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces` |
| `GET` | `/v1/workspaces/current` |
| `GET` | `/v1/workspaces/:workspaceId` (hook ready; used in later slices) |

## Delivered

### API layer

- [`apps/web/src/lib/api/fetch.ts`](apps/web/src/lib/api/fetch.ts) — `apiFetch` with Bearer token + envelope parsing
- [`apps/web/src/lib/api/client-core.ts`](apps/web/src/lib/api/client-core.ts) — `ApiError`, `parseApiResponse`, `apiBaseUrl`
- [`apps/web/src/lib/api/query-keys.ts`](apps/web/src/lib/api/query-keys.ts) — hierarchical query key factory
- [`apps/web/src/lib/api/types/`](apps/web/src/lib/api/types/) — enums, user, workspace types
- [`apps/web/src/lib/api/workspaces.ts`](apps/web/src/lib/api/workspaces.ts) — workspace fetch functions
- [`apps/web/src/lib/workspace-storage.ts`](apps/web/src/lib/workspace-storage.ts) — active workspace resolution + localStorage

### Hooks & context

- [`apps/web/src/hooks/api/use-workspaces-api.ts`](apps/web/src/hooks/api/use-workspaces-api.ts)
- [`apps/web/src/providers/workspace-provider.tsx`](apps/web/src/providers/workspace-provider.tsx)
- [`apps/web/src/hooks/use-workspace.ts`](apps/web/src/hooks/use-workspace.ts)

### UI

- [`apps/web/src/components/app/workspace-switcher.tsx`](apps/web/src/components/app/workspace-switcher.tsx)
- [`apps/web/src/components/app/api-error-banner.tsx`](apps/web/src/components/app/api-error-banner.tsx)
- [`apps/web/src/components/app/query-state.tsx`](apps/web/src/components/app/query-state.tsx)
- Sidebar wired in [`app-sidebar.tsx`](apps/web/src/components/app/app-sidebar.tsx)

### Refactors

- [`use-auth-api.ts`](apps/web/src/hooks/api/use-auth-api.ts) — uses shared `queryKeys`
- [`use-linkedin-api.ts`](apps/web/src/hooks/api/use-linkedin-api.ts) — migrated to `apiFetch` + `queryKeys`
- [`lib/api/auth.ts`](apps/web/src/lib/api/auth.ts) — migrated to `apiFetch`
- [`lib/api.ts`](apps/web/src/lib/api.ts) — `useApiClient` delegates to `apiFetch`

### Provider order

```
AppUiProvider → Suspense → WorkspaceProvider → AppShell
```

## Active workspace resolution

1. URL `?ws=<uuid>` (if valid)
2. `localStorage` (`pp_active_workspace_id`)
3. `user.defaultWorkspaceId`
4. First `personal` workspace
5. First workspace in list

## Progress

- [x] `apiFetch` + query key factory
- [x] Shared API types
- [x] Workspace API + hooks
- [x] `WorkspaceProvider` with URL/localStorage sync
- [x] Workspace switcher in sidebar (desktop + mobile)
- [x] `ApiErrorBanner` + `QueryState`
- [x] Auth + LinkedIn hooks migrated
- [x] App shell provider wiring
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Signed in: sidebar shows workspace name from API
- [ ] Multi-workspace: switch updates label, `?ws=`, localStorage
- [ ] Invalid `?ws=` falls back without crash
- [ ] Refresh preserves selection
- [ ] Backend down: error banner + retry in switcher area
- [ ] `/auth/me` and LinkedIn hooks still work

## Out of scope

- Credits sidebar widget (FE-SLICE-04)
- Feature screen API wiring
- Client workspace create (FE-SLICE-17)
- Persisting `defaultWorkspaceId` on switch via PATCH
