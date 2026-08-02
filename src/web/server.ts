import path from 'node:path';
import { RedisStore } from 'connect-redis';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import session from 'express-session';
import helmet from 'helmet';
import { createClient } from 'redis';
import type { Express } from 'express';
import type { BotClient } from '../types/client.js';
import { env } from '../config/env.js';
import { logger } from '../lib/logger.js';
import { createAuthRouter } from './auth.js';
import { createQueueRouter } from './queue-routes.js';
import '../types/session.js';

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Limites generosos o bastante pra uso normal (o painel faz polling de GET /api/queue a cada 4s
// por sessão aberta) mas que travam scripts abusando das rotas. Chave por IP (padrão da lib) —
// múltiplos usuários atrás do mesmo NAT/IP compartilhado dividem o mesmo limite.
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
});

const queueRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

export function createServer(client: BotClient): Express {
  const app = express();

  // O bot roda atrás do proxy reverso do Coolify (Traefik) em produção; sem isso
  // o cookie `secure` nunca seria enviado pelo navegador.
  app.set('trust proxy', 1);

  // helmet precisa vir antes de QUALQUER rota (inclusive o /healthz abaixo) — middleware do
  // Express roda em ordem de registro, então uma rota registrada antes do helmet responde e
  // encerra a cadeia sem nunca passar pelos headers dele.
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          ...helmet.contentSecurityPolicy.getDefaultDirectives(),
          // Capas de faixa (YouTube/SoundCloud/etc.) e avatares do Discord vêm de vários CDNs
          // externos diferentes — não dá pra listar cada domínio, então libera qualquer https.
          'img-src': ["'self'", 'data:', 'https:'],
        },
      },
    }),
  );

  // Healthcheck do container (docker-compose.yml) — fora de qualquer middleware de
  // sessão/autenticação de propósito: não deve criar sessão nem depender de estado do painel, só
  // reportar se o bot está conectado ao Discord.
  app.get('/healthz', (_req, res) => {
    if (client.isReady()) {
      res.status(200).json({ status: 'ok' });
    } else {
      res.status(503).json({ status: 'not_ready' });
    }
  });

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

  app.use('/auth/login', loginRateLimit);
  app.use('/api/queue', queueRateLimit);

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
