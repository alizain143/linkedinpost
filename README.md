# linkedinpost

Monorepo with a NestJS backend and Next.js frontend.

## Structure

```
apps/
  backend/   # NestJS API
  web/       # Next.js app
```

## Prerequisites

- Node.js >= 20
- npm

## Getting started

Install dependencies from the repo root:

```bash
npm install
```

Run both apps in development:

```bash
npm run dev
```

Or run them individually:

```bash
npm run dev:backend   # http://localhost:3000
npm run dev:web       # http://localhost:3001
```

## Build

```bash
npm run build
```
