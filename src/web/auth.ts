import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import type { BotClient } from '../types/client.js';
import {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  fetchDiscordUser,
  fetchUserGuildIds,
} from './discord-oauth.js';
import { env } from '../config/env.js';
import { recordLogin } from '../lib/admin-store.js';
import type { RedisClient } from '../lib/admin-store.js';
import { logger } from '../lib/logger.js';

export function createAuthRouter(client: BotClient, redis: RedisClient) {
  const authRouter = Router();

  authRouter.get('/auth/login', (req, res) => {
    const state = randomBytes(16).toString('hex');
    req.session.oauthState = state;
    res.redirect(buildAuthorizeUrl(state));
  });

  authRouter.get('/auth/discord/callback', (req, res) => {
    void (async () => {
      const { code, state } = req.query;

      if (typeof code !== 'string' || typeof state !== 'string' || state !== req.session.oauthState) {
        res.status(400).send('Requisição de login inválida ou expirada. Tente novamente.');
        return;
      }
      req.session.oauthState = undefined;

      try {
        const accessToken = await exchangeCodeForToken(code);
        const [user, userGuildIds] = await Promise.all([
          fetchDiscordUser(accessToken),
          fetchUserGuildIds(accessToken),
        ]);
        req.session.user = user;
        req.session.userGuildIds = userGuildIds;
        // Limpa uma seleção antiga (ex: login de novo depois de sair) — o usuário escolhe de
        // novo via GET /api/guilds + POST /api/guilds/select.
        req.session.selectedGuildId = undefined;
        await recordLogin(redis, user);
        res.redirect('/');
      } catch (error) {
        logger.error('Erro no callback OAuth2:', error);
        res.status(502).send('Não foi possível concluir o login com o Discord.');
      }
    })();
  });

  authRouter.post('/auth/logout', (req, res) => {
    req.session.destroy(() => {
      res.status(204).end();
    });
  });

  authRouter.get('/api/me', (req, res) => {
    void (async () => {
      const user = req.session.user;
      if (!user) {
        res.status(401).json({ error: 'not_authenticated' });
        return;
      }

      // Busca o GuildMember do servidor selecionado pra mostrar o apelido/nome de exibição no
      // topbar, não o @username da conta (mesmo motivo do requester da fila, ver
      // queue-routes.ts). Sem servidor selecionado ainda (ex: durante a tela de seleção), cai de
      // volta pro username — o frontend rechama /api/me depois de POST /api/guilds/select.
      const selectedGuildId = req.session.selectedGuildId;
      const guild = selectedGuildId ? client.guilds.cache.get(selectedGuildId) : undefined;
      const member = await guild?.members.fetch(user.id).catch(() => undefined);

      res.json({
        ...user,
        displayName: member?.displayName ?? user.username,
        isAdmin: user.id === env.adminDiscordId,
      });
    })();
  });

  return authRouter;
}
