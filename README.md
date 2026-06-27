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
- Clerk application (enable **LinkedIn** and **Google** social connections; disable Apple)
- Cloudflare R2 buckets for document storage

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
npm run start:dev   # http://localhost:3000/v1
npm test            # unit tests (see apps/backend/TESTING.md)
```

### Frontend

```bash
cp apps/web/.env.local.example apps/web/.env.local
npm run dev:web     # http://localhost:3001
```

### Clerk setup

1. Create a Clerk app and copy publishable + secret keys into both `.env` files.
2. Under **User & Authentication → Social connections**, enable **LinkedIn** and **Google** only.
3. Add a webhook endpoint: `POST https://your-api/v1/auth/webhooks/clerk` for `user.created` and `user.deleted`.
4. Set allowed redirect URLs to `http://localhost:3001`.

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
2. `PUT` file to returned `uploadUrl`
3. `PATCH /v1/auth/me` with `{ profileDocumentId }` to attach a profile image
