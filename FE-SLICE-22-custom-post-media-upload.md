# FE-SLICE-22 — Custom post media upload

> **Status:** Done  
> **Depends on:** SLICE-26 backend upload APIs

## Delivered

- `PostMediaPanel` — upload / generate AI / clear on Post Detail
- Generate page — upload for quick-draft variants and council results
- `uploadPostMediaFiles` helper (init → PUT → confirm)
- Thumbnails via `PostMediaThumbnail` on Posts, Calendar, Autopilot, Pipeline, Approvals
- Types: `PostMediaType.uploaded`, `media` on calendar/pipeline/approvals summaries

## Checklist

- [x] API client + hooks
- [x] Post Detail panel
- [x] Generate upload actions
- [x] List thumbnails
