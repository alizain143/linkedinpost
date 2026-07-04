# Production image only — Nest is built on the deploy machine (t3.micro OOMs on nest build).
FROM node:20-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/backend/package.json apps/backend/
COPY apps/backend/prisma apps/backend/prisma

ENV NODE_OPTIONS=--max-old-space-size=384

# Prod deps only; prisma CLI installed globally for migrate deploy
RUN npm ci -w backend --omit=dev --ignore-scripts \
  && npm install -g prisma@6.19.3 \
  && prisma generate --schema=apps/backend/prisma/schema.prisma \
  && npm cache clean --force

COPY apps/backend/dist apps/backend/dist

WORKDIR /app/apps/backend
EXPOSE 3001
CMD ["node", "dist/src/main.js"]
