import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { buildAuthorizeUrl, exchangeCodeForToken, fetchDiscordUser } from './discord-oauth.js';
import { logger } from '../lib/logger.js';

export const authRouter = Router();

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
  if (!req.session.user) {
    res.status(401).json({ error: 'not_authenticated' });
    return;
  }
  res.json(req.session.user);
});
