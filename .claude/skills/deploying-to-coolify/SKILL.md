---
name: deploying-to-coolify
description: Explains how to deploy or redeploy the Marola Beat Discord bot to production on Coolify, including environment variables, why no port/domain should be exposed, and when slash commands need re-registering. Use when the user asks about deploying, redeploying, or troubleshooting the bot running on Coolify.
---

# Deploying to Coolify

Full walkthrough lives in [DEPLOYMENT.md](../../../DEPLOYMENT.md) — read it for the complete setup.
This is the quick-reference version.

## Key facts

- Two services in `docker-compose.yml`: `bot` (Discord WebSocket + web panel on port 3000 — the
  only one that gets a Coolify domain) and `lavalink` (audio backend, internal-only, never expose a
  port/domain for it). See [README.md](../../../README.md#painel-web) for the web panel and
  [DEPLOYMENT.md](../../../DEPLOYMENT.md) for the full env var list.
- Coolify builds directly from `Dockerfile`/`docker-compose.yml` in this repo via its GitHub App
  integration. Auto Deploy on push to `main` should be enabled on the resource.
- Required runtime environment variables in Coolify: `DISCORD_TOKEN`, `DISCORD_APP_ID`,
  `DISCORD_CLIENT_SECRET`, `WEB_GUILD_ID`, `PUBLIC_URL`, `SESSION_SECRET`, `LAVALINK_PASSWORD`
  (shared secret between `bot` and `lavalink`, any random string — `openssl rand -hex 32`),
  `YOUTUBE_OAUTH_REFRESH_TOKEN` (obtained via a one-time device-code flow after first deploy, see
  DEPLOYMENT.md's "Autenticação OAuth do YouTube"). Optional: `GUILD_ID` (leave empty in
  production for global commands), `LOG_LEVEL`.
- `restart: unless-stopped` is already set in `docker-compose.yml` — both containers come back
  after a crash or host reboot automatically.

## Redeploying after a code change

Pushing to `main` is enough if Auto Deploy is on — Coolify rebuilds and restarts the container.
No manual action needed unless the change touched slash command definitions (see below).

## When to re-run command registration

`npm run register` is **not** part of the container's runtime — it's a one-off script that talks to
Discord's REST API. Run it manually (locally, with production credentials, or via a temporary
shell) whenever a command's name, description, or options changed:

```bash
DISCORD_TOKEN=... DISCORD_APP_ID=... npm run register
```

Global registration (no `GUILD_ID`) can take up to an hour to propagate; that's expected, not a
bug.

## Troubleshooting

- Bot container restarting in a loop → check Coolify logs first; usually a missing/invalid env var
  (all required ones are validated and named clearly by `src/config/env.ts` at startup) — most
  commonly a missing `LAVALINK_PASSWORD` after this env var was added.
- Voice/audio errors → check the `lavalink` service's own logs in Coolify, not just `bot`'s. The
  actual Discord voice UDP connection and audio transcoding happen there
  (`lavalink/application.yml`), not in the bot process.
- YouTube tracks failing to load specifically (other sources like SoundCloud still work) → the
  bundled `youtube-plugin` in `lavalink/application.yml` occasionally needs updating to a newer
  version when YouTube changes its client detection; check
  [lavalink-devs/youtube-source releases](https://github.com/lavalink-devs/youtube-source/releases)
  for a newer version and bump it in both the `plugins.youtube` dependency line.
- YouTube searches failing with `Invalid status code for search response: 400` even though the
  plugin loaded fine → the host (Hetzner, named explicitly in the plugin's own docs) is being
  IP-blocked by YouTube for search requests. Fixed by OAuth — see `YOUTUBE_OAUTH_REFRESH_TOKEN`
  above.
- `docker-compose.yml`'s single-file bind mounts (`./lavalink/application.yml:...`) can silently
  become an **empty directory** on the host instead of picking up the file's content, if Coolify's
  persistent `/data/coolify/applications/<uuid>/...` copy of that path was created before the
  source file existed (this happened on this project's very first Lavalink deploy). Symptom: the
  service runs and passes healthchecks but silently ignores the whole config file — check with
  `cat /data/coolify/applications/<uuid>/lavalink/application.yml` on the host; if it says "Is a
  directory", `rmdir` it, recreate it as a real file with the correct content, then trigger a full
  **Redeploy** from Coolify's UI (a bare `docker restart` is not reliable here — it can leave the
  container exited instead of relaunching it; a redeploy recreates the container cleanly).
