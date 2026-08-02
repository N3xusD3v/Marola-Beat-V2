import { Router } from 'express';
import type { BotClient } from '../types/client.js';

interface GuildDTO {
  id: string;
  name: string;
  icon: string | null;
}

function guildIdField(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const value = (body as Record<string, unknown>).guildId;
  return typeof value === 'string' ? value : undefined;
}

/**
 * GET /api/guilds e POST /api/guilds/select — servidores em comum entre o usuário e o bot, e a
 * escolha de qual gerenciar. Cruza `session.userGuildIds` (IDs do usuário, buscados uma vez no
 * login via escopo OAuth `guilds`) com `client.guilds.cache` (servidores onde o bot está) —
 * nome/ícone vêm sempre do cache do bot, não da API do usuário, por ser a fonte mais confiável
 * pra servidores onde o bot de fato está.
 */
export function createGuildsRouter(client: BotClient) {
  const router = Router();

  router.get('/', (req, res) => {
    if (!req.session.user) {
      res.status(401).json({ error: 'not_authenticated' });
      return;
    }

    const userGuildIds = req.session.userGuildIds;
    if (!userGuildIds) {
      // Sessão de antes desta feature (sem o escopo `guilds` autorizado ainda) — não temos como
      // saber os servidores do usuário sem pedir login de novo.
      res.status(409).json({ error: 'guilds_not_cached' });
      return;
    }

    const guilds: GuildDTO[] = [];
    for (const guildId of userGuildIds) {
      const guild = client.guilds.cache.get(guildId);
      if (guild) {
        guilds.push({ id: guild.id, name: guild.name, icon: guild.iconURL({ size: 64 }) });
      }
    }

    res.json({ guilds, selectedGuildId: req.session.selectedGuildId ?? null });
  });

  router.post('/select', (req, res) => {
    if (!req.session.user) {
      res.status(401).json({ error: 'not_authenticated' });
      return;
    }

    const guildId = guildIdField(req.body);
    const userGuildIds = req.session.userGuildIds ?? [];
    if (!guildId || !userGuildIds.includes(guildId) || !client.guilds.cache.has(guildId)) {
      res.status(403).json({ error: 'guild_not_available' });
      return;
    }

    req.session.selectedGuildId = guildId;
    res.status(204).end();
  });

  return router;
}
