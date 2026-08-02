import type { NextFunction, Request, Response } from 'express';
import type { BotClient } from '../types/client.js';

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
 * Requer login + servidor selecionado (ver guilds-routes.ts) + estar no momento no mesmo canal
 * de voz que o bot está usando naquele servidor. Se o bot ainda não estiver conectado a nenhum
 * canal, qualquer canal de voz do servidor é aceito.
 */
export function requireVoiceMember(client: BotClient) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.session.user) {
      res.status(401).json({ error: 'not_authenticated' });
      return;
    }

    const guildId = req.session.selectedGuildId;
    if (!guildId) {
      res.status(409).json({ error: 'no_guild_selected' });
      return;
    }

    const guild = client.guilds.cache.get(guildId);
    if (!guild) {
      res.status(503).json({ error: 'bot_not_ready' });
      return;
    }

    const voiceChannelId = guild.voiceStates.cache.get(req.session.user.id)?.channelId;
    if (!voiceChannelId) {
      res.status(403).json({ error: 'not_in_voice_channel' });
      return;
    }

    const activeChannelId = client.lavalink.getPlayer(guildId)?.voiceChannelId;
    if (activeChannelId && activeChannelId !== voiceChannelId) {
      res.status(403).json({ error: 'wrong_voice_channel' });
      return;
    }

    req.voice = { guildId, voiceChannelId };
    next();
  };
}
