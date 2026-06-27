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

## Images — Phase 5 `media` module (not yet implemented)

| Route | Model | Use case |
|-------|-------|----------|
| Primary | **Nano Banana 2** (Google) | Quote cards, carousel slides — fast (~1–3s), strong text-on-image |
| Secondary | **Imagen 4** (Google Vertex) | Photoreal hero shots — same Vertex integration |

Nano Banana 2's weakness is photorealism. Add Imagen 4 as `ModelRouter.image('photoreal')` when needed.

### Future env (Phase 5)

```env
GOOGLE_CLOUD_PROJECT=
GOOGLE_APPLICATION_CREDENTIALS=
GOOGLE_IMAGE_MODEL=          # Nano Banana 2 model id
GOOGLE_IMAGE_MODEL_PHOTOREAL= # Imagen 4
```

## Capability routing

```
ModelRouter.text()   → OpenAI GPT-5.4 (Slice 08)
ModelRouter.image()  → Google Nano Banana 2 (Phase 5)
                     → Google Imagen 4 (optional photoreal tier)
ModelRouter.embedding() → TBD (vector RAG, Slice 09+)
```
