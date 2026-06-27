# Generation module

Internal AI generation pipeline for linkedinpost. Slice 07 delivers the foundation only — no HTTP routes yet.

## Quick Draft flow

```
QuickDraftInput
    → ContextAssembler (providers merge GenerationContext)
    → PromptRenderer (quick-draft v1 templates)
    → ModelRouter.text().complete()
    → QuickDraftOutputParser (3 variants)
    → QuickDraftResult
```

## Context providers

Providers run in `order` ascending:

| Order | Provider | Output slice |
|------:|----------|--------------|
| 10 | `UserContextProvider` | `user` |
| 20 | `ContentProfileContextProvider` | `contentProfile`, `contentProfileId` |
| 30 | `GenerationInputContextProvider` | `input` |
| 40 | `DocumentContextProvider` | `documents` |

`ContentProfileContextProvider` resolution:

1. Explicit `contentProfileId` in workspace
2. Else profile with `isDefault: true`
3. Else oldest profile (`createdAt asc`)
4. Else `GENERATION_CONTEXT_ERROR`

## Prompts

Registry key: `quick-draft` v1. Templates use `{{placeholder}}` syntax (e.g. `{{contentProfile.name}}`, `{{input.topic}}`).

## LLM layer

| Symbol / class | Role |
|----------------|------|
| `MODEL_ROUTER` | DI token for `ModelRouter` |
| `MockModelRouter` | Default in `GenerationModule` |
| `MockTextCompletionProvider` | Returns valid 3-variant JSON |
| `ImageGenerationProvider` | Interface only (Slice 09+) |

Swap `MODEL_ROUTER` to a real provider implementation in a later slice.

## Errors

```typescript
generationContextError('...')  // 400, code: GENERATION_CONTEXT_ERROR
generationParseError('...')    // 422, code: GENERATION_PARSE_ERROR
```

## Usage (internal)

```typescript
constructor(private readonly quickDraftGenerator: QuickDraftGenerator) {}

const result = await this.quickDraftGenerator.generate({
  workspaceId,
  userId,
  topic: 'Shipping weekly',
});
// result.variants.length === 3
```

## Exports

`GenerationModule` exports:

- `QuickDraftGenerator`
- `ContextAssembler`

## Tests

Co-located `*.spec.ts` under `src/modules/generation/`. Run:

```bash
npm test -- --testPathPattern=generation
```
