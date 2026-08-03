import 'dotenv/config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Env {
  discordToken: string;
  discordAppId: string;
  discordClientSecret: string;
  guildId?: string;
  publicUrl: string;
  sessionSecret: string;
  redisUrl: string;
  port: number;
  logLevel: LogLevel;
  lavalinkHost: string;
  lavalinkPort: number;
  lavalinkPassword: string;
  adminDiscordId: string;
}

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variável de ambiente obrigatória ausente: ${name}. Copie .env.example para .env e preencha os valores.`,
    );
  }
  return value;
}

const VALID_LOG_LEVELS: LogLevel[] = ['debug', 'info', 'warn', 'error'];

function logLevel(): LogLevel {
  const value = process.env.LOG_LEVEL;
  if (value && VALID_LOG_LEVELS.includes(value as LogLevel)) return value as LogLevel;
  return 'info';
}

function port(): number {
  const value = Number(process.env.PORT ?? 3000);
  return Number.isInteger(value) && value > 0 ? value : 3000;
}

function lavalinkPort(): number {
  const value = Number(process.env.LAVALINK_PORT ?? 2333);
  return Number.isInteger(value) && value > 0 ? value : 2333;
}

export const env: Env = {
  discordToken: required('DISCORD_TOKEN'),
  discordAppId: required('DISCORD_APP_ID'),
  discordClientSecret: required('DISCORD_CLIENT_SECRET'),
  guildId: process.env.GUILD_ID || undefined,
  publicUrl: required('PUBLIC_URL').replace(/\/+$/, ''),
  sessionSecret: required('SESSION_SECRET'),
  redisUrl: required('REDIS_URL'),
  port: port(),
  logLevel: logLevel(),
  lavalinkHost: process.env.LAVALINK_HOST || 'lavalink',
  lavalinkPort: lavalinkPort(),
  lavalinkPassword: required('LAVALINK_PASSWORD'),
  // ID Discord do único usuário com acesso ao painel /admin (lista de servidores, remoção do bot
  // e histórico de login). Tem um padrão pra não travar o boot se a env var ainda não foi
  // cadastrada no Coolify — mas dá pra sobrescrever, e é o valor que deve ir pra lá em produção.
  adminDiscordId: process.env.ADMIN_DISCORD_ID || '336324156595634176',
};
