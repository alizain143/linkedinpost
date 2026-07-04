# Slice 01 — Auth, Account Settings, Notifications & Content Profile

**Status:** Complete  
**Phase:** Foundation + Phase 1 (partial)

## Goal

Extend account settings on `/auth/me`, add notification preference flags on `User`, and introduce workspace-scoped Content Profile CRUD with a minimal personal `Workspace` model.

## Dependencies

- Clerk auth (Slice 0)
- Prisma `User` + `Document` + R2 uploads

## Delivered

### Prisma

- Extended `User`: `timezone`, notification booleans, `plan`
- `Workspace`, `WorkspaceMember`, `ContentProfile`, `ContentPillar`
- Migration: `20250627180000_add_user_settings_workspaces_content_profiles`

### API

| Method | Route |
|--------|-------|
| `GET/PATCH` | `/v1/auth/me` (timezone, notifications, plan, defaultWorkspaceId) |
| `GET` | `/v1/workspaces` |
| `GET` | `/v1/workspaces/current` |
| CRUD | `/v1/workspaces/:workspaceId/content-profiles` |

### Modules

- `workspaces/`, `content-profiles/`
- Extended `users/` (no new controller)

### Behaviors

- Personal workspace auto-created on signup and lazy auth sync
- One `isDefault` content profile per workspace
- Pillars replaced atomically on profile update
- Swagger on all endpoints

## Progress

- [x] Prisma schema + migration
- [x] WorkspacesService (`ensurePersonalWorkspace`, `assertMember`)
- [x] User create hook + guard lazy sync
- [x] Extended `/auth/me` response + PATCH
- [x] Workspaces GET endpoints
- [x] Content profiles CRUD
- [x] AppModule wiring
- [x] PRODUCT_OVERVIEW checkboxes

## Out of scope

- LinkedIn OAuth, XPay billing, agency workspaces, email sending, frontend Settings/Profile pages
