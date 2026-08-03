import { Router } from 'express';
import type { NextFunction, Request, Response } from 'express';
import type { BotClient } from '../types/client.js';
import { env } from '../config/env.js';
import { getGuildActivity, getTrackedUsers, removeGuildActivity } from '../lib/admin-store.js';
import type { RedisClient } from '../lib/admin-store.js';
import { logger } from '../lib/logger.js';

interface AdminGuildDTO {
  id: string;
  name: string;
  icon: string | null;
  memberCount: number;
  joinedAt: string | null;
  lastActiveAt: string | null;
  lastActiveUser: string | null;
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * GET/POST /api/admin/* — painel de gestão restrito a um único usuário (`env.adminDiscordId`),
 * o dono do bot. Lista os servidores onde o bot está (dados sempre lidos do cache live do
 * client, nunca de um banco), permite removê-lo de um servidor, e lista quem já logou no painel
 * (histórico agregado em Redis, ver src/lib/admin-store.ts — não existe outra persistência no
 * projeto).
 */
function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user || req.session.user.id !== env.adminDiscordId) {
    res.status(403).json({ error: 'forbidden' });
    return;
  }
  next();
}

export function createAdminRouter(client: BotClient, redis: RedisClient) {
  const router = Router();
  router.use(requireAdmin);

  router.get('/stats', (req, res) => {
    void (async () => {
      try {
        const [users, activity] = await Promise.all([getTrackedUsers(redis), getGuildActivity(redis)]);
        const guilds = [...client.guilds.cache.values()];
        const totalMembers = guilds.reduce((sum, guild) => sum + guild.memberCount, 0);
        const sevenDaysAgo = Date.now() - SEVEN_DAYS_MS;
        const activeUsersLast7Days = users.filter(
          (user) => new Date(user.lastLoginAt).getTime() >= sevenDaysAgo,
        ).length;
        const activeGuildsLast7Days = [...activity.values()].filter(
          (guildActivity) => new Date(guildActivity.lastActiveAt).getTime() >= sevenDaysAgo,
        ).length;

        res.json({
          guildCount: guilds.length,
          totalMembers,
          userCount: users.length,
          activeUsersLast7Days,
          activeGuildsLast7Days,
        });
      } catch (error) {
        logger.error('Erro ao montar estatísticas do painel admin:', error);
        res.status(500).json({ error: 'stats_failed' });
      }
    })();
  });

  router.get('/guilds', (req, res) => {
    void (async () => {
      try {
        const [activity, users] = await Promise.all([getGuildActivity(redis), getTrackedUsers(redis)]);
        const usersById = new Map(users.map((user) => [user.id, user]));

        const guilds: AdminGuildDTO[] = [...client.guilds.cache.values()].map((guild) => {
          const guildActivity = activity.get(guild.id);
          const lastUser = guildActivity ? usersById.get(guildActivity.lastUserId) : undefined;
          return {
            id: guild.id,
            name: guild.name,
            icon: guild.iconURL({ size: 64 }),
            memberCount: guild.memberCount,
            joinedAt: guild.members.me?.joinedAt?.toISOString() ?? null,
            lastActiveAt: guildActivity?.lastActiveAt ?? null,
            lastActiveUser: lastUser?.username ?? null,
          };
        });
        guilds.sort((a, b) => b.memberCount - a.memberCount);

        res.json({ guilds });
      } catch (error) {
        logger.error('Erro ao listar servidores no painel admin:', error);
        res.status(500).json({ error: 'guilds_failed' });
      }
    })();
  });

  router.post('/guilds/:id/leave', (req, res) => {
    void (async () => {
      const guildId = req.params.id;
      const guild = guildId ? client.guilds.cache.get(guildId) : undefined;
      if (!guild) {
        res.status(404).json({ error: 'guild_not_found' });
        return;
      }

      try {
        await guild.leave();
        await removeGuildActivity(redis, guild.id);
        res.status(204).end();
      } catch (error) {
        logger.error('Erro ao remover o bot de um servidor via painel admin:', error);
        res.status(500).json({ error: 'leave_failed' });
      }
    })();
  });

  router.get('/users', (req, res) => {
    void (async () => {
      try {
        const users = await getTrackedUsers(redis);
        users.sort((a, b) => new Date(b.lastLoginAt).getTime() - new Date(a.lastLoginAt).getTime());
        res.json({ users });
      } catch (error) {
        logger.error('Erro ao listar usuários no painel admin:', error);
        res.status(500).json({ error: 'users_failed' });
      }
    })();
  });

  return router;
}
