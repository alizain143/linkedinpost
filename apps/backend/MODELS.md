# AI model strategy

Living reference for text and image model choices. Implementation details in [`GENERATION.md`](GENERATION.md).

## Text — OpenAI GPT-5.4 (standard)

| Setting | Value |
|---------|-------|
| Env | `OPENAI_TEXT_MODEL` (default: `gpt-5.4`) |
| Tier | Standard — **not** Pro |
| Cost (approx) | ~$2.50 in / $15 out per M tokens |
| Used by | Quick draft, council (future) |

**Why not Pro:** LinkedIn posts are short-form. Pro's reasoning premium buys little here and hurts margins.

**Open caveat:** GPT was chosen on assumption, not a side-by-side vs Claude/Gemini. Schedule ~30 min voice eval later if quality is the differentiator. `ModelRouter.text()` supports swapping providers without flow changes.

Verify the exact OpenAI API model slug in the dashboard when upgrading.

## Images — Nano Banana 2 (Slice 17)

| Route | Model | Use case |
|-------|-------|----------|
| Primary | **Nano Banana 2** (`gemini-3.1-flash-image`) | Quote cards — council media creator |
| Secondary | **Imagen 4** (Google Vertex) | Photoreal hero shots — deferred |

`ConfigModelRouter.image()` uses mock when `MEDIA_GENERATION_MOCK=true` or no Google creds; otherwise `GoogleImageGenerationProvider`.

### Env

```env
GEMINI_API_KEY=                 # dev (Google AI Studio)
GOOGLE_CLOUD_PROJECT=           # prod (Vertex)
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_IMAGE_MODEL=gemini-3.1-flash-image
MEDIA_GENERATION_MOCK=true
GOOGLE_APPLICATION_CREDENTIALS= # Vertex ADC (optional path)
```

## Capability routing

```
ModelRouter.text()   → OpenAI GPT-5.4 (Slice 08)
ModelRouter.image()  → Nano Banana 2 when creds + mock off (Slice 17)
                     → Mock 1×1 PNG otherwise
                     → Imagen 4 photoreal tier (deferred)
ModelRouter.embedding() → TBD (vector RAG, Slice 09+)
```
