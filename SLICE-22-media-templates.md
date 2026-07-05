# Slice 22 — Media templates (layout JSON + SVG/PNG)

**Status:** Complete  
**Phase:** Media

## Goal

Dual media lanes: keep freestyle AI images, add a **template** lane with authored layout JSON, Figma-lite editor, AI template authoring, and deterministic SVG→PNG render.

## Behavior

- Workspace-scoped `MediaTemplate` rows (layout scene graph)
- System preset: Identity Card (`system:identity-card`)
- Default resolution: post override → content profile → workspace → system preset
- Default media mode: workspace `defaultMediaMode` (`freestyle` | `template`)
- Template lane: LLM fills text slots + `visualPrompt`; each `visual_zone` is filled by the image model and composited into the SVG → Resvg PNG
- Freestyle lane: unchanged Nano Banana path (full-bleed image)
- Credits: template **1**, freestyle **2**

## API

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/media-templates` |
| `POST` | `/v1/workspaces/:workspaceId/media-templates` |
| `POST` | `/v1/workspaces/:workspaceId/media-templates/from-preset/:presetId` |
| `POST` | `/v1/workspaces/:workspaceId/media-templates/ai-draft` |
| `POST` | `/v1/workspaces/:workspaceId/media-templates/preview` |
| `PUT` | `/v1/workspaces/:workspaceId/media-templates/default` |
| `PUT` | `/v1/workspaces/:workspaceId/media-templates/default-mode` |
| `GET/PATCH/DELETE` | `/v1/workspaces/:workspaceId/media-templates/:id` |
| `POST` | `/v1/workspaces/:workspaceId/media-templates/:id/preview` |

Generate media / council accept optional `mediaMode` + `mediaTemplateId`.

## Frontend

- `/app/templates` — list, presets, defaults, AI create
- `/app/templates/[id]` — Figma-lite editor (layers, drag, properties, PNG preview)
  - Add/delete any layer type (text, avatar, visual zone, headline, subhead, rect)
  - At most **one** visual zone per template
  - Canvas bounds clamping on drag, edit, and save
  - Live preview uses workspace LinkedIn name/title/photo when connected

## Template profile binds

| Bind | Resolution order |
|------|------------------|
| `profile.name` | LinkedIn `fullName` → content profile `name` → Clerk name |
| `profile.roleTitle` | LinkedIn `currentTitle` → content profile `roleTitle` |
| `profile.avatar` | LinkedIn `pictureUrl` → Clerk `profileImageUrl` → initials |
| `profile.industry` | content profile `industry` |

## Progress

- [x] Prisma: `MediaTemplate`, `MediaMode`, defaults, post fields
- [x] SVG/Resvg renderer + slot-fill
- [x] CRUD + resolve + AI author
- [x] Wire council / media-only jobs
- [x] Templates UI + editor
- [x] Docs
