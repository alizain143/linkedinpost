# Slice 17 — Real image generation (Nano Banana 2)

**Status:** Complete  
**Phase:** Post–Phase 5 polish (real council quote cards)

## One outcome

Council media creator calls `ModelRouter.image()` and receives real quote-card images from **Nano Banana 2** (`gemini-3.1-flash-image`) when Google credentials are configured. Mock 1×1 PNG remains when `MEDIA_GENERATION_MOCK=true` or no creds.

## Dependencies

- Slice 13: `PostMedia`, `MediaService`, mock provider
- Slice 10: council media creator/reviewer pipeline
- Slice 16: LinkedIn publish with `PostMedia` (PNG/JPEG)

## Model

| Setting | Value |
|---------|-------|
| Product | Nano Banana 2 |
| Model ID | `gemini-3.1-flash-image` (default) |
| SDK | `@google/genai` |
| API | `generateContent` with `responseModalities: [IMAGE]` |

## Auth

| Path | Env |
|------|-----|
| Dev (Gemini API) | `GEMINI_API_KEY` |
| Prod (Vertex) | `GOOGLE_CLOUD_PROJECT`, `GOOGLE_CLOUD_LOCATION`, ADC |

Resolution: API key first; else Vertex; else mock.

## Env

```env
MEDIA_GENERATION_MOCK=true
GEMINI_API_KEY=
GOOGLE_CLOUD_PROJECT=
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_IMAGE_MODEL=gemini-3.1-flash-image
```

Set `MEDIA_GENERATION_MOCK=false` and provide credentials to enable real images.

## Router logic

```
ConfigModelRouter.image()
  → mock if MEDIA_GENERATION_MOCK=true
  → mock if no Google creds
  → GoogleImageGenerationProvider otherwise
```

## MIME types

Council may return `image/png` or `image/jpeg` from Google. Both are stored in R2 and supported for LinkedIn publish.

## Progress

- [x] `@google/genai` + `google.config.ts`
- [x] `GoogleGenAIClientFactory` (API key + Vertex)
- [x] `GoogleImageGenerationProvider`
- [x] `ConfigModelRouter.image()` routing
- [x] JPEG support in `POST_MEDIA_MIME_TYPES`
- [x] Unit tests + docs

## Out of scope

- Imagen 4 / photoreal tier
- Vision media reviewer
- `POST /posts/:id/regenerate-media`
- PNG conversion via sharp
- Frontend changes

## Test plan

```bash
cd apps/backend && npm test && npm run build
```

Manual: `MEDIA_GENERATION_MOCK=false` + `GEMINI_API_KEY` → run council → `GET .../posts/:id` shows real quote card.
