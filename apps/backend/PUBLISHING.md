# Publishing module

LinkedIn publish uses **per-workspace OAuth tokens** when configured. See [LINKEDIN-OAUTH.md](./LINKEDIN-OAUTH.md) for connect flow and agency multi-profile setup. Original Clerk path: [SLICE-12-linkedin-publish.md](../../SLICE-12-linkedin-publish.md).

## LinkedIn setup

1. LinkedIn Developer Portal: **Sign In with LinkedIn (OIDC)** + **Share on LinkedIn**
2. Scopes: `openid`, `profile`, `email`, `w_member_social`
3. Add redirect URL: `{API_BASE}/v1/linkedin/oauth/callback`
4. Set `LINKEDIN_CLIENT_ID` and `LINKEDIN_CLIENT_SECRET` in backend `.env`
5. Clerk Dashboard: LinkedIn OIDC (same Client ID/Secret) — app sign-in only

## Token source

| Workspace state | Publish token |
|-----------------|---------------|
| `linkedInAccessToken` set | Workspace token (refreshed automatically) |
| Legacy Clerk bind only | Clerk `getUserOauthAccessToken` (single account) |

## HTTP API

| Method | Route |
|--------|-------|
| `GET` | `/v1/workspaces/:workspaceId/linkedin/oauth/start` |
| `GET` | `/v1/workspaces/:workspaceId/linkedin/connection` |
| `GET` | `/v1/workspaces/:workspaceId/linkedin/profile` |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/sync` |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import-token` |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import/extract` |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import` |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/import/authenticated` |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/publish` |

## Profile sync

`POST /linkedin/profile/sync` fetches:

- **userinfo (OIDC)** — name, email, photo, member id, locale (always)
- **identityMe** — attempted when the workspace token allows; often returns 403 without extra LinkedIn products. Rich profile fields come from **user import** (extension or paste).

`headline` and `summary` are null from the API. **User import** (browser extension or paste) fills About, headline, and full experience.

Stored on `Workspace.linkedInProfile` JSON (and legacy `User.linkedInProfile` for personal workspaces).

## Profile import (user-initiated)

See [SLICE-23-linkedin-profile-import.md](../../SLICE-23-linkedin-profile-import.md).

1. **OAuth connect** — basic profile via API (publish-ready).
2. **Import token** — `POST .../profile/import-token` (Clerk auth) → 10 min HMAC token + suggested LinkedIn URL.
3. **Extension capture + extract** — extension expands “see more”, captures sanitized `main` HTML + page text, then:
   - `POST .../profile/import/extract` with `importToken` → LLM returns structured preview JSON.
4. **Review + save** — user confirms in Settings; `POST .../profile/import/authenticated` (or extension token import) merges into workspace profile.
5. **Paste fallback** — web form still sends structured JSON directly.
6. **Validation** — imported profile URL slug must match connected account; rate limit 5/hour per workspace (save).
7. **Merge** — OAuth wins for `memberId`, `email`, `pictureUrl`; import wins for `headline`, `summary`, `positions[]`, `education[]`.

Chrome extension: `apps/linkedin-import-extension/` (load unpacked in dev).

## Publish flow

```
approved | scheduled | failed(publish) → publishing → published | failed
```

Publish uses conditional `updateMany` (`approved|scheduled|failed → publishing`); concurrent publish returns 409. Worker retries from `scheduled` or `failed` when `scheduledAt` matches the job payload.

Scheduled: `SchedulingService` requires Redis **before** DB write, then enqueues `publish-jobs` with delay = `scheduledAt - now`. `PublishReconcileService` re-enqueues scheduled posts on startup.

## Env

```env
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_OAUTH_REDIRECT_URI=http://localhost:3001/v1/linkedin/oauth/callback
LINKEDIN_PUBLISH_MOCK=true
LINKEDIN_API_VERSION=202601
REDIS_URL=redis://localhost:6379
```

## Tests

```bash
npm test -- --testPathPattern=linkedin|publish-status
```
