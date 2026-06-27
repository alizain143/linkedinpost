# Slice 07 — Generation Foundation

**Status:** Complete  
**Phase:** Phase 3 — Generation (foundation only)

## Goal

Internal generation pipeline for Quick Draft: context assembly, prompt rendering, mock LLM completion, and structured output parsing. No HTTP route or job queue yet.

## Dependencies

- Slice 01: `User`, `ContentProfile`, `ContentPillar`
- Slice 06: `CreditsGuard` (wired in Slice 08+ for `POST /generate/quick`)

## Module layout

```
apps/backend/src/modules/generation/
├── generation.module.ts
├── generation.types.ts
├── generation.errors.ts
├── flows/
├── context/
├── prompts/
├── prompt-renderer.ts
├── quick-draft-output.parser.ts
└── llm/
```

## Key behaviors

| Component | Responsibility |
|-----------|----------------|
| `ContextAssembler` | Runs context providers in order, merges slices |
| `UserContextProvider` | Loads `User` from Prisma |
| `ContentProfileContextProvider` | Explicit `contentProfileId` or default → oldest |
| `GenerationInputContextProvider` | Maps request fields to `context.input` |
| `DocumentContextProvider` | Uses `ContextRetriever` (`NoOp` → `[]`) |
| `PromptRenderer` | Renders `quick-draft` v1 templates to `LlmMessage[]` |
| `QuickDraftOutputParser` | Validates exactly 3 variants |
| `QuickDraftGenerator` | `assemble → render → complete → parse` |
| `MockModelRouter` | Returns deterministic JSON for tests/dev |

## Errors

| Code | When |
|------|------|
| `GENERATION_CONTEXT_ERROR` | No content profile in workspace |
| `GENERATION_PARSE_ERROR` | Invalid LLM JSON / variant shape |

## Progress

- [x] Generation module + types + errors
- [x] Context providers + assembler
- [x] Prompt registry + renderer
- [x] Output parser + mock LLM
- [x] `QuickDraftGenerator` flow
- [x] Unit tests (6 spec files)
- [x] `GenerationModule` registered in `AppModule`
- [x] `GENERATION.md` + PRODUCT_OVERVIEW update

## Out of scope

- `POST /generate/quick` HTTP endpoint
- Job queue / `GET /jobs/:id`
- Real OpenAI/Anthropic providers
- Credit deduct on generation
- Document RAG retrieval

## Test plan

```bash
cd apps/backend && npm test && npm run build
```

Unit tests:

- `user-context.provider.spec.ts`
- `content-profile-context.provider.spec.ts`
- `context-assembler.spec.ts`
- `prompt-renderer.spec.ts`
- `quick-draft-output.parser.spec.ts`
- `quick-draft.generator.spec.ts`
