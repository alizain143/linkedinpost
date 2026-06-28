# FE-Slice 10 — LinkedIn connection (real API)

**Status:** Complete  
**Depends on:** FE-SLICE-01

## Goal

Wire LinkedIn connection display and gating to the backend API while keeping Clerk OAuth for connect, reauthorize, and disconnect flows.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET` | `/v1/linkedin/connection` |
| `GET` | `/v1/linkedin/profile` |
| `POST` | `/v1/linkedin/profile/sync` |

Maps to backend SLICE-12.

## Delivered

### API layer

- [`lib/api/types/linkedin.ts`](apps/web/src/lib/api/types/linkedin.ts)
- [`lib/api/linkedin.ts`](apps/web/src/lib/api/linkedin.ts)
- [`lib/linkedin-utils.ts`](apps/web/src/lib/linkedin-utils.ts) — connection state helpers

### Hooks

- [`use-linkedin-api.ts`](apps/web/src/hooks/api/use-linkedin-api.ts) — `useLinkedInConnection`, `useLinkedInProfile`, `useSyncLinkedInProfile`, `useInvalidateLinkedIn`

### App integration

- [`app-ui-provider.tsx`](apps/web/src/providers/app-ui-provider.tsx) — API status + Clerk OAuth actions; `linkedinConnectionState` on context
- [`app-shell-client.tsx`](apps/web/src/components/app/app-shell-client.tsx) — prefetch connection query
- [`linkedin-callback-handler.tsx`](apps/web/src/components/app/linkedin-callback-handler.tsx) — profile sync + query invalidation after connect

### Surfaces

- [`Dashboard.tsx`](apps/web/src/components/sections/app/dashboard/Dashboard.tsx) — connect vs finish-setup banners
- [`Settings.tsx`](apps/web/src/components/sections/app/settings/Settings.tsx) — status, profile subtitle, refresh profile
- [`app-topbar.tsx`](apps/web/src/components/app/app-topbar.tsx) — connect / finish setup / connected badge
- [`connect-linkedin-modal.tsx`](apps/web/src/components/modals/connect-linkedin-modal.tsx) — connect vs reauthorize copy

## Behaviors

- Three connection states: `disconnected`, `needsPublishScope`, `publishReady`
- API is authoritative for display; Clerk fallback while connection query loads
- Connect callback syncs profile and invalidates LinkedIn queries
- Disconnect invalidates LinkedIn queries after Clerk account removal
- `LINKEDIN_NOT_CONNECTED` and scheduling error codes added to `api-error-messages.ts` (for FE-SLICE-11)

## Progress

- [x] LinkedIn types + fetch + utils
- [x] Query hooks + invalidation
- [x] AppUiProvider + callback wiring
- [x] Dashboard / Settings / Topbar updates
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Fresh user sees connect CTAs on Dashboard, Settings, Topbar
- [ ] OAuth connect → redirect → profile sync toast → green connected badge
- [ ] User connected without publish scope sees amber "Finish setup" surfaces
- [ ] Finish setup triggers Clerk reauthorize with `w_member_social`
- [ ] Disconnect updates API status and restores connect CTAs
- [ ] Refresh profile in Settings updates subtitle when available
- [ ] Reconnect notification hidden when publish ready

## Out of scope

- Schedule/publish API wiring (FE-SLICE-11)
- Generate/Autopilot mock flows
