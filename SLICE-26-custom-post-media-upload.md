# SLICE-26 — Custom post media upload

> **Status:** Done  
> **Goal:** Users can upload custom JPEG/PNG images (single or carousel) onto a post, interchangeable with AI generate/replace.

## Scope

- Presigned R2 upload into `PostMedia` with `mediaType: uploaded`
- Init → client PUT → confirm (0 credits)
- Replace archives prior active set; sets `mediaFormat` single (1) or carousel (2–10)
- Manage on Post Detail + Generate; thumbnails on Posts / Calendar / Autopilot / Pipeline / Approvals
- LinkedIn publish unchanged (consumes active `PostMedia`)

## Out of scope

- WebP / GIF / video
- Upload on public approval share page
- Image cropper

## API

| Method | Route | Notes |
|--------|-------|-------|
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/media/uploads/init` | Presign slots |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/media/uploads/confirm` | Verify + activate |
| `DELETE` | `/v1/workspaces/:workspaceId/posts/:id/media` | Archive active media |

## Schema

- `PostMediaType.uploaded`
- `PostMediaUploadStatus` (`pending` \| `ready`)
- `PostMedia.mediaBatchId`, `uploadStatus`, `uploadExpiresAt`

## Checklist

- [x] Schema + migration
- [x] MediaService init/confirm/clear + batch apply
- [x] List/calendar/pipeline/approvals/autopilot include media
- [x] Frontend panel + upload on Generate/Post Detail
- [x] Thumbnails on list surfaces
- [x] Docs
