# syntax=docker/dockerfile:1.7
# Multi-stage build con Bun. Imagen final ~80MB.
# Build: docker build -t my-api .
# Run:   docker run -p 3000:3000 --env-file .env my-api

FROM oven/bun:1-alpine AS deps
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile --production

FROM oven/bun:1-alpine AS builder
WORKDIR /app
COPY package.json bun.lockb* ./
RUN bun install --frozen-lockfile
COPY tsconfig.json bunfig.toml drizzle.config.ts ./
COPY src ./src
COPY scripts ./scripts
RUN bun build src/server.ts --target=bun --outdir=dist --minify

FROM oven/bun:1-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package.json ./
USER bun
EXPOSE 3000

# Healthcheck — Bun.serve responde en /healthz mientras el proceso vive.
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/healthz || exit 1

CMD ["bun", "run", "dist/server.js"]
