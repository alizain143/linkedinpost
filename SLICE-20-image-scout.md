# SLICE-20 — Image Scout and reference selection

**Status:** Complete

## Scope

- `image-scout` module with Google Custom Search (mock fallback via Picsum)
- Council `image_scout` step pauses at `awaiting_media_selection`
- APIs:
  - `GET /v1/workspaces/:workspaceId/jobs/:id/media-references`
  - `POST /v1/workspaces/:workspaceId/jobs/:id/media-references` (resume job)
- Nano Banana multimodal reference images in `GoogleImageGenerationProvider`
- `MediaReferencePicker` UI on Generate council timeline

## Env

```env
GOOGLE_CSE_API_KEY=
GOOGLE_CSE_CX=
```

When unset, scout returns mock reference thumbnails.
