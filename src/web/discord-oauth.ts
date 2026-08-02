import { env } from '../config/env.js';
import type { SessionUser } from '../types/session.js';

const DISCORD_API = 'https://discord.com/api/v10';
const REDIRECT_URI = `${env.publicUrl}/auth/discord/callback`;
// `guilds` (além de `identify`) é o que permite listar os servidores do usuário em GET
// /api/guilds, pra montar o seletor de servidor — não usamos `guilds.members.read` (não
// precisamos: permissão de canal de voz já é checada via cache do próprio bot, ver
// middleware.ts). Usuários que já autorizaram só `identify` antes veem a tela de consentimento
// de novo (comportamento normal do OAuth2 quando o escopo pedido muda).
const SCOPE = 'identify guilds';

export function buildAuthorizeUrl(state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: env.discordAppId,
    scope: SCOPE,
    state,
    redirect_uri: REDIRECT_URI,
    // Sem `prompt`: deixa o Discord decidir (pula a tela de consentimento se o usuário já
    // autorizou exatamente esses escopos, mostra se não). `prompt=none` forçava pular sempre —
    // arriscado agora que adicionamos o escopo `guilds`: usuários que só tinham `identify`
    // autorizado poderiam cair num erro em vez de ver a tela pedindo o escopo novo.
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

interface DiscordPartialGuild {
  id: string;
}

/**
 * Lista os IDs dos servidores do usuário (escopo `guilds`). A API já limita a 200 por padrão —
 * o máximo de servidores que uma conta de usuário (não-bot) pode ter, então nunca precisa de
 * paginação (ver documentação oficial do Discord). Só os IDs importam aqui: nome/ícone vêm do
 * cache do próprio bot (`client.guilds.cache`) em guilds-routes.ts, que é a fonte mais confiável
 * pra servidores onde o bot está.
 */
export async function fetchUserGuildIds(accessToken: string): Promise<string[]> {
  const response = await fetch(`${DISCORD_API}/users/@me/guilds`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Falha ao buscar servidores do usuário (${response.status}).`);
  }

  const data = (await response.json()) as DiscordPartialGuild[];
  return data.map((guild) => guild.id);
}
