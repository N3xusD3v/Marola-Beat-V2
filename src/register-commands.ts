import { REST, Routes } from 'discord.js';
import { env } from './config/env.js';
import { commands } from './commands/index.js';
import { logger } from './lib/logger.js';

async function register(): Promise<void> {
  const body = commands.map((command) => command.data.toJSON());
  const rest = new REST({ version: '10' }).setToken(env.discordToken);

  const route = env.guildId
    ? Routes.applicationGuildCommands(env.discordAppId, env.guildId)
    : Routes.applicationCommands(env.discordAppId);

  try {
    logger.info(`Registrando ${body.length} comando(s) de barra (${env.guildId ? 'guild' : 'global'})...`);
    await rest.put(route, { body });
    logger.info('✅ Comandos registrados com sucesso.');
  } catch (error) {
    logger.error('❌ Erro ao registrar comandos:', error);
    process.exit(1);
  }
}

void register();
