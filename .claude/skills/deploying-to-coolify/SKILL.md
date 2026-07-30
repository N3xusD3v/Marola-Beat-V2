---
name: deploying-to-coolify
description: Explains how to deploy or redeploy the Marola Beat Discord bot to production on Coolify, including environment variables, why no port/domain should be exposed, and when slash commands need re-registering. Use when the user asks about deploying, redeploying, or troubleshooting the bot running on Coolify.
---

# Deploying to Coolify

Full walkthrough lives in [DEPLOYMENT.md](../../../DEPLOYMENT.md) — read it for the complete setup.
This is the quick-reference version.

## Key facts

- The bot is a **background worker**, not a web app: it only holds a WebSocket connection to
  Discord. Never assign a domain or expose a port for this service in Coolify — it has no HTTP
  server.
- Coolify builds directly from `Dockerfile`/`docker-compose.yml` in this repo via its GitHub App
  integration. Auto Deploy on push to `main` should be enabled on the resource.
- Required runtime environment variables in Coolify: `DISCORD_TOKEN`, `DISCORD_APP_ID`. Optional:
  `GUILD_ID` (leave empty in production for global commands), `LOG_LEVEL`.
- `restart: unless-stopped` is already set in `docker-compose.yml` — the container comes back after
  a crash or host reboot automatically.

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

- Bot container restarting in a loop → check Coolify logs first; usually a missing/invalid
  `DISCORD_TOKEN` or `DISCORD_APP_ID`, surfaced clearly by `src/config/env.ts` at startup.
- Voice/audio errors → confirm the `ffmpeg` package installed in the `Dockerfile` runtime stage
  wasn't removed; `discord-player` needs it for transcoding regardless of the extractor used.
