# Slice 24 — Carousel templates + freestyle carousel

**Status:** Complete  
**Phase:** Media

## Goal

Multi-slide LinkedIn carousels via two lanes:

| Lane | Trigger | Output |
|------|---------|--------|
| Template carousel | `mediaFormat: carousel` + carousel identity preset | N branded PNG slides (first / middle / last layouts) |
| Freestyle carousel | `mediaFormat: carousel` + no template / freestyle | N full-bleed AI images |

Both lanes share slide-count logic, credit model, multi-attach storage, and LinkedIn multi-image publish.

## System preset

- ID: `system:carousel-identity`
- Layout v2 JSON: `pages.first`, `pages.middle`, `pages.last`
- Middle page reuses identity card + `carousel_nav` ("Swipe →")
- Editable per page in template editor (First | Middle | Last tabs)

## Credits

| Format | Cost |
|--------|------|
| Single template | 1 cr |
| Single freestyle | 2 cr |
| Carousel (N slides) | **N × 2 cr** |

Slide count: AI auto (3–10) or user override via `carouselSlideCount`.

## API fields

- `PostPackage.mediaFormat`: `single` | `carousel`
- `PostPackage.carouselSlideCount`: optional override
- DTOs: `GenerateMediaRequestDto`, `QuickDraftRequestDto`, `CouncilRequestDto`, `CalendarGenerateRequestDto`

## Publish

- 1 image → `content.media` (unchanged)
- 2–20 images → `content.multiImage.images` via LinkedIn Posts API

## Progress

- [x] Carousel identity preset + layout v2 + carousel_nav element
- [x] Template + freestyle carousel render services
- [x] Multi-slide attach + carousel toggle UI
- [x] LinkedIn multi-image publish
- [x] Template editor page tabs
