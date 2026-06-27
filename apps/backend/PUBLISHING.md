# Publishing module

LinkedIn publish via Clerk OAuth. See [SLICE-12-linkedin-publish.md](../../SLICE-12-linkedin-publish.md).

## Clerk setup

1. LinkedIn Developer Portal: enable **Sign In with OpenID Connect** + **Share on LinkedIn**
2. Scopes: `openid`, `profile`, `email`, `w_member_social`
3. Clerk Dashboard: LinkedIn OIDC with your Client ID/Secret

## OAuth paths

| User signed in via | Action |
|--------------------|--------|
| LinkedIn | After sign-in, `reauthorize` with `w_member_social` if missing |
| Email / other | Connect LinkedIn with `createExternalAccount` + `w_member_social` |

Tokens stay in Clerk. Backend calls `getUserOauthAccessToken` at publish/sync time.

## HTTP API

| Method | Route |
|--------|-------|
| `GET` | `/v1/linkedin/connection` |
| `GET` | `/v1/linkedin/profile` |
| `POST` | `/v1/linkedin/profile/sync` |
| `POST` | `/v1/workspaces/:workspaceId/posts/:id/publish` |

## Profile sync

`POST /linkedin/profile/sync` fetches:

- **userinfo (OIDC)** — name, email, photo, member id, locale (always)
- **identityMe (optional)** — profile URL, current title/company, education when LinkedIn returns them

`headline` and `summary` are always null on sync. Full work history and About text are deferred to a future slice.

Stored on `User.linkedInProfile` JSON.

## Publish flow

```
approved | scheduled | failed(publish) → publishing → published | failed
```

Scheduled: `SchedulingService` enqueues `publish-jobs` with delay = `scheduledAt - now`.

## Env

```env
LINKEDIN_PUBLISH_MOCK=true
LINKEDIN_API_VERSION=202601
REDIS_URL=redis://localhost:6379
```

## Tests

```bash
npm test -- --testPathPattern=linkedin|publish-status
```
