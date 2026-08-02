import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import type { BotClient } from '../types/client.js';
import { env } from '../config/env.js';
import { buildAuthorizeUrl, exchangeCodeForToken, fetchDiscordUser } from './discord-oauth.js';
import { logger } from '../lib/logger.js';

export function createAuthRouter(client: BotClient) {
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
        req.session.user = await fetchDiscordUser(accessToken);
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

      // Busca o GuildMember pra mostrar o apelido do servidor/nome de exibição no topbar, não o
      // @username da conta (mesmo motivo do requester da fila, ver queue-routes.ts).
      const guild = client.guilds.cache.get(env.webGuildId);
      const member = await guild?.members.fetch(user.id).catch(() => undefined);

      res.json({ ...user, displayName: member?.displayName ?? user.username });
    })();
  });

  return authRouter;
}
