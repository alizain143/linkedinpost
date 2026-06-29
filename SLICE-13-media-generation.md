# Slice 13 — Media generation

**Status:** Complete  
**Phase:** Phase 5 — Autopilot & media (media only)

## Goal

Replace the council media stub with real image generation (mock provider in dev), persist assets as `PostMedia` in R2, and expose them on post detail GET.

## Dependencies

- Slice 10: AI Council media creator/reviewer pipeline
- Slice 09: BullMQ council jobs
- Phase 0: R2 storage

## Prisma

Migration `20250629110000_add_post_media`:

- Enums: `PostMediaType` (`quote_card`), `PostMediaSource` (`council`)
- Model: `PostMedia` linked to `PostPackage` and optional `CouncilRun`

## API changes

No new routes. Extended response:

| Method | Route | Change |
|--------|-------|--------|
| `GET` | `/v1/workspaces/:workspaceId/posts/:id` | Adds `media[]` |

### `media[]` item shape

```json
{
  "id": "uuid",
  "postPackageId": "uuid",
  "mediaType": "quote_card",
  "source": "council",
  "url": "https://...",
  "altText": "...",
  "sortOrder": 0,
  "mimeType": "image/png",
  "sizeBytes": 70,
  "createdAt": "2026-06-27T12:00:00.000Z"
}
```

## Council flow

1. Media Creator LLM returns image prompt spec (not `stub_pending_phase5`)
2. `ModelRouter.image()` generates PNG bytes (mock in Slice 13)
3. Media Reviewer text QA (unchanged)
4. On pass: `MediaService.attachCouncilMedia` uploads to R2 + creates `PostMedia`
5. Post status → `ready_for_approval`

## Env

```env
R2_BUCKET_POST_MEDIA=post-media
R2_PUBLIC_POST_MEDIA_URL=
MEDIA_GENERATION_MOCK=true
```

When `R2_PUBLIC_POST_MEDIA_URL` is empty, `url` is a presigned download link (15 min TTL).

## Progress

- [x] `PostMedia` model + migration
- [x] R2 `putObject` + post-media bucket config
- [x] `media` module + `MediaService`
- [x] `MockImageGenerationProvider` + `ModelRouter.image()`
- [x] Council orchestrator integration
- [x] `GET post` includes `media[]`
- [x] Unit tests + docs

## Out of scope

- Imagen 4 / photoreal tier — [SLICE-17](SLICE-17-nano-banana-image-generation.md)
- Vision media reviewer
- ~~`POST /posts/:id/regenerate-media`~~ — implemented as `POST /posts/:id/generate-media` (media-only job)
- Manual media upload
- `media[]` on list/calendar/pipeline
- Frontend

LinkedIn publish with images: [SLICE-16](SLICE-16-linkedin-publish-media.md)

## Test plan

```bash
cd apps/backend && npm test && npm run build
```

After a council job completes, `GET .../posts/:id` should return `media[0].url` and no stub status in council events.
