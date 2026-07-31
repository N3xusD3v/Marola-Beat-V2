# syntax=docker/dockerfile:1

FROM node:25-alpine AS base
WORKDIR /app

# ---- Dependencies (full, for build) ----
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# ---- Build TypeScript -> dist ----
FROM deps AS build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ---- Production-only dependencies ----
FROM base AS prod-deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# ---- Final runtime image ----
FROM node:25-alpine AS runtime
# Audio transcoding and the actual Discord voice UDP connection now happen in the separate
# Lavalink service (see docker-compose.yml) — this container no longer needs ffmpeg.
# tini is used as PID 1 so SIGTERM from Coolify/Docker triggers a clean shutdown.
RUN apk add --no-cache tini \
    && addgroup -S bot && adduser -S bot -G bot

WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY public ./public
COPY package.json ./

USER bot
ENV NODE_ENV=production
EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "--enable-source-maps", "dist/index.js"]
