import type { NextFunction, Request, Response } from 'express';
import type { BotClient } from '../types/client.js';
import { env } from '../config/env.js';

export interface VoiceContext {
  guildId: string;
  voiceChannelId: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      voice?: VoiceContext;
    }
  }
}

/**
 * Requer login + estar no momento no mesmo canal de voz que o bot está usando
 * na guild configurada (WEB_GUILD_ID). Se o bot ainda não estiver conectado a
 * nenhum canal, qualquer canal de voz da guild é aceito.
 */
export function requireVoiceMember(client: BotClient) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.status(401).json({ error: 'not_authenticated' });
      return;
    }

    const guild = client.guilds.cache.get(env.webGuildId);
    if (!guild) {
      res.status(503).json({ error: 'bot_not_ready' });
      return;
    }

    const voiceChannelId = guild.voiceStates.cache.get(req.session.user.id)?.channelId;
    if (!voiceChannelId) {
      res.status(403).json({ error: 'not_in_voice_channel' });
      return;
    }

    const activeChannelId = client.lavalink.getPlayer(env.webGuildId)?.voiceChannelId;
    if (activeChannelId && activeChannelId !== voiceChannelId) {
      res.status(403).json({ error: 'wrong_voice_channel' });
      return;
    }

    req.voice = { guildId: env.webGuildId, voiceChannelId };
    next();
  };
}
