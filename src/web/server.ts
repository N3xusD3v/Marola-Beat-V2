import path from 'node:path';
import { RedisStore } from 'connect-redis';
import express from 'express';
import session from 'express-session';
import { createClient } from 'redis';
import type { Express } from 'express';
import type { BotClient } from '../types/client.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { createAuthRouter } from './auth.js';
import { createQueueRouter } from './queue-routes.js';
import '../types/session.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export function createServer(client: BotClient): Express {
  const app = express();

  // O bot roda atrás do proxy reverso do Coolify (Traefik) em produção; sem isso
  // o cookie `secure` nunca seria enviado pelo navegador.
  app.set('trust proxy', 1);

  // Store de sessão em Redis em vez do MemoryStore padrão do express-session: o MemoryStore
  // vaza memória, perde todas as sessões a cada restart/redeploy do container e não escala além
  // de um processo — os três já viraram dor real em produção. O client enfileira comandos
  // internamente enquanto conecta, então não é preciso esperar o connect() antes de aceitar
  // requisições (mesmo padrão do exemplo oficial do connect-redis).
  const redisClient = createClient({ url: env.redisUrl });
  redisClient.on('error', (error: unknown) => logger.error('Erro na conexão com o Redis:', error));
  redisClient.connect().catch((error: unknown) => logger.error('Erro ao conectar no Redis:', error));

  const redisStore = new RedisStore({
    client: redisClient,
    prefix: 'marola-beat:sess:',
  });

  app.use(express.json({ limit: '10kb' }));
  app.use(
    session({
      store: redisStore,
      name: 'marola.sid',
      secret: env.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: env.publicUrl.startsWith('https://'),
        maxAge: ONE_DAY_MS,
      },
    }),
  );

  app.use(createAuthRouter(client));
  app.use('/api/queue', createQueueRouter(client));
  app.use(express.static(path.join(process.cwd(), 'public')));

  app.use((_req, res) => {
    res.status(404).json({ error: 'not_found' });
  });

  return app;
}

export function startServer(client: BotClient): void {
  const app = createServer(client);
  app.listen(env.port, () => {
    logger.info(`Painel web ouvindo na porta ${env.port} (${env.publicUrl})`);
  });
}
