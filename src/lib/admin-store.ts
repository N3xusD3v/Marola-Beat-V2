// Interface estrutural com só os comandos de hash usados aqui, em vez de importar o tipo
// completo de `createClient()` do pacote `redis` — os generics dele (módulos/RESP version)
// inferem valores diferentes dependendo de como `createClient()` é chamado, o que faz o TS
// rejeitar a atribuição do client real (criado com `{ url }` em server.ts) a esse tipo derivado
// noutro lugar sem argumentos. O client de verdade sempre satisfaz esta interface estruturalmente.
export interface RedisClient {
  hGet(key: string, field: string): Promise<string | null>;
  hSet(key: string, field: string, value: string): Promise<number>;
  hGetAll(key: string): Promise<Record<string, string>>;
  hDel(key: string, field: string): Promise<number>;
}

export interface TrackedUser {
  id: string;
  username: string;
  avatar: string | null;
  firstLoginAt: string;
  lastLoginAt: string;
  loginCount: number;
}

export interface GuildActivity {
  lastActiveAt: string;
  lastUserId: string;
}

interface LoginUser {
  id: string;
  username: string;
  avatar: string | null;
}

// Hashes no mesmo Redis que já guarda a sessão (connect-redis) — sem banco de dados novo. Só
// dados agregados/não-sensíveis (id, username, avatar, timestamps), consultados pelo painel
// /admin (ver src/web/admin-routes.ts).
const USERS_KEY = 'marola-beat:admin:users';
const GUILD_ACTIVITY_KEY = 'marola-beat:admin:guild-activity';

async function upsertUser(redis: RedisClient, user: LoginUser, incrementLoginCount: boolean): Promise<void> {
  const now = new Date().toISOString();
  const raw = await redis.hGet(USERS_KEY, user.id);
  const existing = raw ? (JSON.parse(raw) as TrackedUser) : undefined;
  const record: TrackedUser = {
    id: user.id,
    username: user.username,
    avatar: user.avatar,
    firstLoginAt: existing?.firstLoginAt ?? now,
    lastLoginAt: now,
    loginCount: (existing?.loginCount ?? 0) + (incrementLoginCount ? 1 : 0),
  };
  await redis.hSet(USERS_KEY, user.id, JSON.stringify(record));
}

export async function recordLogin(redis: RedisClient, user: LoginUser): Promise<void> {
  await upsertUser(redis, user, true);
}

// Chamado a cada requisição autenticada de fila (junto com recordGuildActivity) — sem isso, quem
// já tinha uma sessão válida de antes desta feature existir (não passa pelo callback OAuth de
// novo até a sessão expirar) nunca aparece na lista de usuários, mesmo usando o painel
// ativamente. Não incrementa loginCount (que fica reservado pra logins de fato via OAuth).
export async function touchUser(redis: RedisClient, user: LoginUser): Promise<void> {
  await upsertUser(redis, user, false);
}

export async function getTrackedUsers(redis: RedisClient): Promise<TrackedUser[]> {
  const all = await redis.hGetAll(USERS_KEY);
  return Object.values(all).map((raw) => JSON.parse(raw) as TrackedUser);
}

// Chamado a cada requisição autenticada de fila (ver o middleware em queue-routes.ts) — mede
// "usou o painel", não só "logou uma vez".
export async function recordGuildActivity(
  redis: RedisClient,
  guildId: string,
  userId: string,
): Promise<void> {
  const activity: GuildActivity = { lastActiveAt: new Date().toISOString(), lastUserId: userId };
  await redis.hSet(GUILD_ACTIVITY_KEY, guildId, JSON.stringify(activity));
}

export async function getGuildActivity(redis: RedisClient): Promise<Map<string, GuildActivity>> {
  const all = await redis.hGetAll(GUILD_ACTIVITY_KEY);
  const map = new Map<string, GuildActivity>();
  for (const [guildId, raw] of Object.entries(all)) {
    map.set(guildId, JSON.parse(raw) as GuildActivity);
  }
  return map;
}

export async function removeGuildActivity(redis: RedisClient, guildId: string): Promise<void> {
  await redis.hDel(GUILD_ACTIVITY_KEY, guildId);
}
