import 'dotenv/config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Env {
  discordToken: string;
  discordAppId: string;
  discordClientSecret: string;
  guildId?: string;
  webGuildId: string;
  publicUrl: string;
  sessionSecret: string;
  port: number;
  logLevel: LogLevel;
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

export const env: Env = {
  discordToken: required('DISCORD_TOKEN'),
  discordAppId: required('DISCORD_APP_ID'),
  discordClientSecret: required('DISCORD_CLIENT_SECRET'),
  guildId: process.env.GUILD_ID || undefined,
  webGuildId: required('WEB_GUILD_ID'),
  publicUrl: required('PUBLIC_URL').replace(/\/+$/, ''),
  sessionSecret: required('SESSION_SECRET'),
  port: port(),
  logLevel: logLevel(),
};
