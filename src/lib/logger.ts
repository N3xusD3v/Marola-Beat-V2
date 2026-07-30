import { env } from '../config/env.js';

const LEVEL_WEIGHT = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type Level = keyof typeof LEVEL_WEIGHT;

function write(level: Level, args: unknown[]): void {
  if (LEVEL_WEIGHT[level] < LEVEL_WEIGHT[env.logLevel]) return;
  const timestamp = new Date().toISOString();
  const tag = level.toUpperCase().padEnd(5);
  const method = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
  method(`[${timestamp}] [${tag}]`, ...args);
}

export const logger = {
  debug: (...args: unknown[]) => write('debug', args),
  info: (...args: unknown[]) => write('info', args),
  warn: (...args: unknown[]) => write('warn', args),
  error: (...args: unknown[]) => write('error', args),
};
