import { env } from '../config/env.js';
import type { SessionUser } from '../types/session.js';

const DISCORD_API = 'https://discord.com/api/v10';
const REDIRECT_URI = `${env.publicUrl}/auth/discord/callback`;
const SCOPE = 'identify';

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.discordAppId,
    scope: SCOPE,
    state,
    redirect_uri: REDIRECT_URI,
    prompt: 'none',
  });
  return `https://discord.com/oauth2/authorize?${params.toString()}`;
}

interface TokenResponse {
  access_token: string;
}

export async function exchangeCodeForToken(code: string): Promise<string> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
    client_id: env.discordAppId,
    client_secret: env.discordClientSecret,
  });

  const response = await fetch(`${DISCORD_API}/oauth2/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error(`Falha ao trocar código OAuth2 por token (${response.status}).`);
  }

  const data = (await response.json()) as TokenResponse;
  return data.access_token;
}

interface DiscordUserResponse {
  id: string;
  username: string;
  avatar: string | null;
}

export async function fetchDiscordUser(accessToken: string): Promise<SessionUser> {
  const response = await fetch(`${DISCORD_API}/users/@me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar usuário do Discord (${response.status}).`);
  }

  const data = (await response.json()) as DiscordUserResponse;
  return { id: data.id, username: data.username, avatar: data.avatar };
}
