# SLICE-24 — Draft UX toolkit, apply-changes agent, council inline result

**Status:** Complete

## Scope

- Persist topic suggestions until explicit regenerate (localStorage session)
- Quick Draft card toolkit: reject/undo, inline edit, per-variant regen, read aloud, voice input, copy, media prompt, credit confirms, compare mode (full-width side-by-side, hides generator), Select for me (`POST /generate/compare-pick`), stale session banner
- `POST /generate/quick-single` (1 credit) and `POST /posts/:id/apply-changes` (1 credit)
- Workspace `changesApplyMode`: `review_first` | `auto_apply`
- Media generate supports optional prompt + `replace` for existing images
- Council result shows post inline with text/image regen and shared actions
- Settings Workflow preference; Approvals Changes tab **Apply with AI**

## Key routes

| Method | Route | Cost |
|--------|-------|------|
| `POST` | `.../generate/quick-single` | 1 |
| `POST` | `.../generate/compare-pick` | Free |
| `POST` | `.../posts/:id/apply-changes` | 1 |
| `POST` | `.../posts/:id/generate-media` | 2 |
| `PATCH` | `.../workspaces/:workspaceId` | — (`changesApplyMode`) |

## Migration

`20260704120000_changes_apply_mode_and_job_types`
