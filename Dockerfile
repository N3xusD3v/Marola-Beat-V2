# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
# youtube-dl-exec (pulled in as a transitive fix for discord-player-youtubei) tries to
# download a yt-dlp binary via a Python-based preinstall check. We never use that fallback
# path, so skip the check instead of installing a full Python toolchain just for this.
ENV YOUTUBE_DL_SKIP_PYTHON_CHECK=1

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
FROM node:22-alpine AS runtime
# ffmpeg is required by discord-player for audio transcoding.
# tini is used as PID 1 so SIGTERM from Coolify/Docker triggers a clean shutdown.
RUN apk add --no-cache ffmpeg tini \
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
