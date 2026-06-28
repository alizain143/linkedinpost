# FE-Slice 02 — Auth, Settings, Profile Photo

**Status:** Complete  
**Depends on:** FE-SLICE-01

## Goal

Settings page fully backed by API; profile photo via R2 presign; real user display name in shell; graceful auth errors.

## Backend APIs

| Method | Route |
|--------|-------|
| `GET/PATCH` | `/v1/auth/me` |
| `POST` | `/v1/documents/init` |

Profile attach happens via `PATCH /auth/me` with `profileDocumentId` (backend calls `attachProfileDocument`).

## Delivered

### Settings (`/app/settings`)

- Account name save via `useUpdateCurrentUser`
- Notification toggles persisted to API
- Profile photo: `uploadDocument` → `PATCH profileDocumentId`
- **Timezone** select with IANA values (`lib/timezones.ts`) → `PATCH timezone`
- `QueryState` loading skeleton + error banner with retry
- `ApiError` mapped to friendly toasts (`lib/api-error-messages.ts`)

### API layer

- [`lib/api/documents.ts`](apps/web/src/lib/api/documents.ts) — `initDocumentUpload` via `apiFetch`
- [`lib/documents/upload-document.ts`](apps/web/src/lib/documents/upload-document.ts) — uses documents API module

### Auth hook

- [`use-auth-api.ts`](apps/web/src/hooks/api/use-auth-api.ts) — no retry on `ACCOUNT_DELETED`
- `getUserFirstName()` helper for dashboard welcome

### Shell

- [`Dashboard.tsx`](apps/web/src/components/sections/app/dashboard/Dashboard.tsx) — "Welcome back, {name}" from API

## Progress

- [x] IANA timezone list + Settings wiring
- [x] QueryState + ApiError handling on settings
- [x] Document init via apiFetch
- [x] Dashboard welcome name from API
- [x] `npm run build` passes

## Test plan (manual)

- [ ] Settings loads account fields from API
- [ ] Name save persists after refresh
- [ ] Notification toggle persists
- [ ] Timezone change sends IANA value in PATCH body
- [ ] Profile photo upload updates avatar
- [ ] Invalid file type shows friendly error
- [ ] Backend down → error banner + retry on settings
- [ ] Dashboard shows real first name

## Out of scope

- LinkedIn connection real API (FE-SLICE-10)
- Publishing setting mocks (default account, approval mode)
- Billing / delete account backend
