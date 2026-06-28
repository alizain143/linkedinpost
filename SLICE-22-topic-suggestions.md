# SLICE-22 — Topic suggestions (magic button)

**Status:** Complete

## Scope

- LLM-powered topic suggestions on Generate (free, no credits)
- Personalized to content profile + form selections (post type, tone, pillar, notes)

## API

| Method | Route |
|--------|-------|
| `POST` | `/v1/workspaces/:workspaceId/generate/suggest-topics` |

**Request:** optional `contentProfileId`, `postType`, `tone`, `pillar`, `additionalContext`

**Response:** `{ suggestions: [{ topic, pillar?, rationale? }], promptId, promptVersion, model }` (5–8 items)

## Backend

- `TopicSuggestionsGenerator`, `TopicSuggestionsService`
- Prompt: `topic-suggestions` v1

## Frontend

- Magic button on Topic field in `Generate.tsx`
- `TopicSuggestionsPicker` chip list
