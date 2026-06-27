# Slice 12 — LinkedIn Publish (Clerk OAuth)

**Status:** Complete  
**Phase:** Phase 4 — LinkedIn publish

## Goal

Publish posts to LinkedIn using Clerk OAuth tokens (`w_member_social`), with publish-now API, scheduled BullMQ jobs, profile sync, and dual-path LinkedIn connect.

## Dependencies

- Slice 11: scheduling APIs
- Slice 09: BullMQ job queue
- Clerk LinkedIn OIDC + Share on LinkedIn products

## Prisma

Migration `20250630100000_add_linkedin_publish`:

- `PostPackage`: `linkedInPostId`, `linkedInPostUrl`, `publishError*`, `publishAttemptedAt`
- `User`: `linkedInMemberId`, `linkedInProfileSyncedAt`, `linkedInProfile` (JSON cache)

## API

| Method | Route | Purpose |
|--------|-------|---------|
| `GET` | `/v1/linkedin/connection` | Connection + `publishReady` |
| `GET` | `/v1/linkedin/profile` | Cached profile |
| `POST` | `/v1/linkedin/profile/sync` | Sync from LinkedIn via Clerk token |
| `POST` | `/v1/workspaces/:wsId/posts/:id/publish` | Publish now / retry |

Scheduled posts enqueue `publish-jobs` BullMQ work at `scheduledAt` (Slice 11 schedule endpoints).

Image attach for posts with `PostMedia`: [SLICE-16](SLICE-16-linkedin-publish-media.md).

## LinkedIn profile data (OIDC-only contract)

| Source | Fields |
|--------|--------|
| OIDC `/v2/userinfo` (always) | name, email, photo, member id, locale |
| `/rest/identityMe` (best-effort; often empty without LinkedIn Plus) | profile URL, current title/company, recent education |

`headline` and `summary` are always `null` — not available on OIDC-only sync.

Full job history and bio are **deferred** (see Slice 12b in PRODUCT_OVERVIEW when pursued).

## Clerk OAuth paths

1. **LinkedIn sign-in** → reauthorize with `w_member_social` if missing
2. **Connect flow** → `createExternalAccount` with `additionalScopes: ['w_member_social']`

Backend reads tokens via `getUserOauthAccessToken(clerkId, 'oauth_linkedin_oidc')`.

## Env

```env
LINKEDIN_PUBLISH_MOCK=true
LINKEDIN_API_VERSION=202601
REDIS_URL=redis://localhost:6379
```

## Progress

- [x] Publish metadata migration
- [x] Clerk OAuth + connection status
- [x] Profile sync
- [x] LinkedIn publish service + mock client
- [x] `POST /publish`
- [x] BullMQ `publish-jobs` + scheduling wire
- [x] Frontend publish scope + profile sync on connect

## Test plan

```bash
cd apps/backend && npm test && npm run build
```
