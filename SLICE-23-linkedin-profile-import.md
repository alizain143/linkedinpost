# SLICE-23 — LinkedIn profile import (user-initiated)

**Status:** Done  
**Depends on:** SLICE-12 (LinkedIn publish), FE-SLICE-10 (connection UI)

## Problem

LinkedIn OIDC + optional `identityMe` do not provide About, headline, or full work history. Templates and content-profile AI need richer data.

## Solution (Option D)

User-initiated import — no server-side scraping of third-party profiles:

1. OAuth connect stores basic profile (publish token + identity).
2. User imports from their own LinkedIn session via Chrome extension **or** paste form in Settings.
3. Extension captures sanitized DOM snapshot; backend LLM extracts structured fields.
4. User reviews preview in Settings, then saves.
5. Backend validates profile URL slug matches connected account and merges into `Workspace.linkedInProfile`.

## API

| Method | Route | Auth |
|--------|-------|------|
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import-token` | Clerk (optional body: `{ profileUrl }`) |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import/extract` | `importToken` in body |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import` | `importToken` in body |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import/authenticated` | Clerk |

### Extract request body

```json
{
  "importToken": "...",
  "profileUrl": "https://www.linkedin.com/in/...",
  "pageText": "... visible main text ...",
  "mainHtml": "... sanitized main innerHTML ..."
}
```

Returns structured preview: `headline`, `summary`, `positions[]`, `education[]`, `skills[]`.

## JSON fields (`linkedInProfile`)

| Field | Source |
|-------|--------|
| `memberId`, `email`, `pictureUrl` | OAuth API (authoritative) |
| `headline`, `summary`, `positions[]`, `education[]` | User import (save step) |
| `enrichmentStatus` | `none` \| `complete` |
| `enrichmentSource` | `api_only` \| `user_import` |
| `enrichedAt`, `importedFields` | Import metadata |

## Safety constraints

- Import only on explicit user action (extension button or paste submit).
- Never store LinkedIn cookies or passwords.
- DOM snapshots are used for extraction only — not persisted after merge.
- Never use `/in/me` — import URL always targets the workspace connected profile slug.
- `expectedProfileSlug` returned on import token; extension redirects if the wrong profile is open.
- Rate limit: 5 imports per workspace per hour (save endpoint).
- Profile URL slug must match connected LinkedIn account when OAuth `profileUrl` is known.

## Frontend flow

1. Settings → single **Import profile** button.
2. Checks Chrome extension via `linkedin-extension-bridge` ping.
3. If missing → redirect to `/app/install-linkedin-extension`.
4. If no stored `profileUrl` → modal asks for client LinkedIn URL (first import only); saved on workspace.
5. Fetch import token (with `profileUrl` when needed), extension opens that profile tab.
6. Extension expands “see more”, captures DOM snapshot, POSTs to `/import/extract`.
7. User returns to Settings → preview modal with extracted fields.
8. **Save profile** → `POST .../import/authenticated`.

## Extension

`apps/linkedin-import-extension/` — reload in `chrome://extensions` after pulling changes.

- `capture.js` — sanitized `main` HTML + `pageText` (no CSS selectors for fields).
- `parser.js` — expand “see more” helpers only.
- `background.js` — calls `/import/extract`, delivers preview to web app.

## Backend modules

- `linkedin-profile-import.service.ts`
- `linkedin-profile-snapshot-extract.service.ts`
- `linkedin-profile-snapshot-output.parser.ts`
- `profile-import-token.service.ts`
- `profile-import.merge.ts`
- `profile-url.util.ts`

## Env

- `OPENAI_API_KEY` — required for production extraction (mock fallback in dev without key).

## Tests

```bash
npm test -- --testPathPatterns='profile-import|profile-url|linkedin-profile-import|linkedin-profile-snapshot' --watchman=false
```
