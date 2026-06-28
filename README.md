# linkedinpost

Monorepo with a NestJS backend and Next.js frontend.

## Structure

```
apps/
  backend/   # NestJS API — Clerk auth, Prisma, R2 document uploads
  web/       # Next.js app — Clerk sign-in (LinkedIn + Google)
```

## Prerequisites

- Node.js >= 20
- PostgreSQL
- **Redis** (required for async jobs: AI Council, calendar generation, autopilot, scheduled publish)
- Clerk application (enable **LinkedIn** and **Google** social connections; disable Apple)
- Cloudflare R2 buckets for document storage

### Redis (local)

```bash
brew install redis
brew services start redis
redis-cli ping   # → PONG
```

Add to `apps/backend/.env`:

```env
REDIS_URL=redis://localhost:6379
GENERATION_QUEUE_CONCURRENCY=2
```

Workers run inside the backend process — no separate worker command.

## Getting started

Install dependencies from the repo root:

```bash
npm install
```

### Backend

```bash
cp apps/backend/.env.example apps/backend/.env
cd apps/backend
npx prisma migrate dev
npm run start:dev   # http://localhost:3001/v1
npm test            # unit tests (see apps/backend/TESTING.md)
```

### Frontend

Create `apps/web/.env.local` (see `FRONTEND_IMPLEMENTATION.md` env section), then:

```bash
npm run dev:web     # http://localhost:3000
```

### Clerk setup

1. Create a Clerk app and copy publishable + secret keys into both `.env` files.
2. Under **User & Authentication → Social connections**, enable **LinkedIn** and **Google** only.
3. Add a webhook endpoint: `POST https://your-api/v1/auth/webhooks/clerk` for `user.created` and `user.deleted`.
4. Set allowed redirect URLs to `http://localhost:3000`.

## API routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/v1/health` | Health check |
| GET | `/v1/auth/me` | Current user profile |
| PATCH | `/v1/auth/me` | Update profile / attach profile image |
| POST | `/v1/auth/logout` | Revoke Clerk session |
| POST | `/v1/documents/init` | Get presigned upload URL |
| GET | `/v1/documents/:id` | Document metadata + download URL |

## Document upload flow

1. `POST /v1/documents/init` with `{ filename, mimeType, sizeBytes, purpose }`
2. `PUT` file to returned `uploadUrl` (browser → R2 directly)
3. `PATCH /v1/auth/me` with `{ profileDocumentId }` to attach a profile image

### R2 CORS (required for profile image upload)

The browser uploads to Cloudflare R2 via presigned URLs. Each bucket must allow your frontend origin or uploads fail with a CORS error.

From `apps/backend` (with R2 keys in `.env`):

```bash
npm run r2:configure-cors
```

This allows `FRONTEND_URL`, `http://localhost:3000`, and `http://127.0.0.1:3000` for `GET`, `PUT`, and `HEAD`. Re-run after changing `FRONTEND_URL` for production/staging.

Alternatively, in **Cloudflare Dashboard → R2 → bucket → Settings → CORS policy**, add the same origins and methods.
