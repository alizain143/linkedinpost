# Per-workspace LinkedIn OAuth

Agency users manage multiple client workspaces. Each workspace must publish to a **different LinkedIn profile** under one linkedinpost.ai account.

## Why not Clerk?

Clerk stores **one LinkedIn external account per app user**. Attempting a second `createExternalAccount` for LinkedIn returns:

```
oauth_account_already_connected — "Another account is already connected for this particular provider"
```

Clerk remains used for **app authentication** (email, Google, sign-in). Workspace LinkedIn connect/publish uses **direct LinkedIn OAuth** with tokens stored per workspace.

| Concern | Clerk | Direct OAuth (implemented) |
|--------|-------|----------------------------|
| LinkedIn profiles per user | 1 | 1 per workspace |
| Token storage | Clerk | `Workspace.linkedInAccessToken` (+ refresh) |
| Agency / 5 client workspaces | ❌ | ✅ |
| Publish token source | `getUserOauthAccessToken` | Workspace token (refresh via LinkedIn) |

## Data model

Tokens and profile cache live on `Workspace` (see `DATABASE_SCHEMA.md`):

| Field | Purpose |
|-------|---------|
| `linkedInAccessToken` | OAuth access token for this workspace |
| `linkedInRefreshToken` | Used to refresh expired access tokens |
| `linkedInTokenExpiresAt` | Access token expiry |
| `linkedInMemberId` | LinkedIn person id for publish URN |
| `linkedInProfileName` | Display name |
| `linkedInProfile` | Cached OIDC / identityMe JSON |
| `linkedInClerkExternalAccountId` | Legacy Clerk bind (cleared when direct OAuth is used) |

Migration: `20250704130000_add_workspace_linkedin_tokens`.

## OAuth flow

```
User (workspace W) → GET /workspaces/W/linkedin/oauth/start
                  → { url: LinkedIn authorization URL }
                  → Browser → LinkedIn login/consent
                  → GET /v1/linkedin/oauth/callback?code=&state=
                  → Exchange code → store tokens on workspace W
                  → Sync profile → redirect FRONTEND_URL/app/dashboard?linkedin=connected
                  → linkedin-callback-handler invalidates React Query
```

### State parameter

HMAC-signed JSON (`workspaceId`, `userId`, `exp` 10 min). Verified on callback to prevent CSRF. Secret: `CLERK_SECRET_KEY` or `LINKEDIN_CLIENT_SECRET`.

### Scopes

**Default (always requested):** `openid profile email w_member_social`

Requires these LinkedIn Developer Portal products on your app:

- **Sign In with LinkedIn using OpenID Connect** — `openid`, `profile`, `email`
- **Share on LinkedIn** (or Marketing API) — `w_member_social` for publish

Authorization URL includes `prompt=login` and `max_age=0` to request fresh sign-in when LinkedIn honors OIDC prompt parameters.

### LinkedIn browser session

If the member is already logged into LinkedIn, LinkedIn may **skip** the login screen and reuse the active browser session. There is no reliable `force_login` parameter. To connect a different profile, the user must sign out of LinkedIn first (the connect modal links to `https://www.linkedin.com/m/logout`).

## HTTP API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| `GET` | `/v1/workspaces/:workspaceId/linkedin/oauth/start` | Bearer | Returns `{ url }` for LinkedIn authorization. Optional `?returnPath=/app/...` (same-origin `/app` only) stored in OAuth state for post-connect redirect |
| `GET` | `/v1/linkedin/oauth/callback` | None | LinkedIn redirect; stores tokens; redirects to app |
| `GET` | `/v1/workspaces/:workspaceId/linkedin/connection` | Bearer | Connection + `publishReady` for workspace |
| `DELETE` | `/v1/workspaces/:workspaceId/linkedin/connection` | Bearer | Clear workspace LinkedIn binding + tokens |
| `POST` | `/v1/workspaces/:workspaceId/linkedin/profile/sync` | Bearer | Refresh cached profile from workspace token |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/publish` | Bearer | Publish using workspace token |

Legacy user-level routes (`GET /v1/linkedin/connection`, etc.) remain for personal-workspace fallback when a single Clerk LinkedIn account exists.

## Token resolution (publish / sync)

`LinkedInOAuthService.getWorkspaceAccessToken(workspaceId)`:

1. If `linkedInAccessToken` exists and not expired → return it
2. If expired and `linkedInRefreshToken` exists → refresh via LinkedIn token endpoint, update workspace
3. Else fall back to Clerk OAuth for legacy-bound workspaces (single-account path)

`LinkedInPublishService` always publishes with the token for **that post's workspace** — never another workspace's profile.

## Frontend

| File | Role |
|------|------|
| `apps/web/src/lib/api/linkedin.ts` | `startLinkedInOAuth`, connection CRUD |
| `apps/web/src/providers/app-ui-provider.tsx` | Connect modal; clears workspace binding before OAuth; redirects to `{ url }` |
| `apps/web/src/components/app/linkedin-callback-handler.tsx` | Handles `?linkedin=connected` on dashboard; invalidates queries |
| `apps/web/src/components/modals/connect-linkedin-modal.tsx` | Per-workspace copy + sign-out-of-LinkedIn link |

Connect behavior:

1. User selects workspace in switcher
2. Clicks **Connect** / **Switch account**
3. If workspace already connected → `DELETE .../linkedin/connection` first (no silent re-attach)
4. `GET .../linkedin/oauth/start` → redirect to LinkedIn
5. Callback stores tokens on backend → app shows connected state for **that workspace only**

Connection state is **workspace-scoped** via `useLinkedInConnection(activeWorkspaceId)` — switching workspaces shows each client's LinkedIn status independently.

## Environment

```env
# Required for per-workspace connect
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_OAUTH_REDIRECT_URI=http://localhost:3001/v1/linkedin/oauth/callback

# Publish / API
LINKEDIN_PUBLISH_MOCK=false
LINKEDIN_API_VERSION=202601
```

Use the **same** LinkedIn Developer app as Clerk (same Client ID/Secret).

## LinkedIn Developer Portal

1. **Products:** Sign In with LinkedIn using OpenID Connect + Share on LinkedIn
2. **Auth → Authorized redirect URLs:** add backend callback  
   `http://localhost:3001/v1/linkedin/oauth/callback`  
   (production: `https://api.yourdomain.com/v1/linkedin/oauth/callback`)
3. Clerk's redirect URL stays separate — both can use the same app

## Agency scenario (5 workspaces)

| Workspace | LinkedIn profile | Stored on |
|-----------|------------------|-----------|
| Personal | Your profile | `Workspace` (personal) |
| Client A | Client A's profile | `Workspace` (client) |
| Client B | Client B's profile | `Workspace` (client) |
| … | … | … |

- Scheduling and publish jobs use `post.workspaceId` → that workspace's token
- Disconnecting one workspace does not affect others
- Each connect flow is independent

## Module map

| Component | Path |
|-----------|------|
| OAuth service | `src/modules/linkedin/linkedin-oauth.service.ts` |
| OAuth controller | `src/modules/linkedin/linkedin-oauth.controller.ts` |
| Connection / publish | `src/modules/linkedin/linkedin.services.ts` |
| Workspace store helpers | `src/modules/linkedin/workspace-linkedin.store.ts` |
| Config | `src/config/linkedin.config.ts` |

## Tests

```bash
npm test -- --testPathPatterns='clerk-oauth|linkedin.services' --watchman=false
```

## Related docs

- [PUBLISHING.md](./PUBLISHING.md) — publish flow, BullMQ scheduled jobs
- [SLICE-12-linkedin-publish.md](../../SLICE-12-linkedin-publish.md) — original Clerk-based slice
- [FE-SLICE-10-linkedin-connection.md](../../FE-SLICE-10-linkedin-connection.md) — frontend wiring
- [DATABASE_SCHEMA.md](../../DATABASE_SCHEMA.md) — `Workspace` LinkedIn fields
