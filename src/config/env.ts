import 'dotenv/config';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Env {
  discordToken: string;
  discordAppId: string;
  guildId?: string;
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

export const env: Env = {
  discordToken: required('DISCORD_TOKEN'),
  discordAppId: required('DISCORD_APP_ID'),
  guildId: process.env.GUILD_ID || undefined,
  logLevel: logLevel(),
};
