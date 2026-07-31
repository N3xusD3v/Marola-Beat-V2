import { Client, Collection, GatewayIntentBits, Partials } from 'discord.js';
import type { Interaction } from 'discord.js';
import type { ChannelDeletePacket, VoicePacket, VoiceServer, VoiceState } from 'lavalink-client';
import { env } from './config/env.js';
import { commands } from './commands/index.js';
import { createLavalinkManager } from './lib/lavalink.js';
import { logger } from './lib/logger.js';
import { startServer } from './web/server.js';
import type { BotClient } from './types/client.js';

async function main(): Promise<void> {
  const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates, GatewayIntentBits.GuildMessages],
    partials: [Partials.Channel],
  }) as BotClient;

  client.commands = new Collection();
  for (const command of commands) {
    client.commands.set(command.data.name, command);
  }

  client.lavalink = createLavalinkManager(client);
  // discord.js still emits the untyped legacy 'raw' event (WebSocketManager.js) with every
  // gateway dispatch payload; lavalink-client needs it to forward voice state/server updates.
  client.on('raw', (data: unknown) => {
    // TODO(diagnóstico temporário): remover depois de confirmar o handshake de voz.
    if (typeof data === 'object' && data !== null && 't' in data) {
      const eventType = (data as { t?: unknown }).t;
      if (eventType === 'VOICE_STATE_UPDATE' || eventType === 'VOICE_SERVER_UPDATE') {
        logger.info(`[diag] raw ${String(eventType)} recebido`);
      }
    }
    void client.lavalink.sendRawData(data as VoicePacket | VoiceServer | VoiceState | ChannelDeletePacket);
  });

  client.once('clientReady', () => {
    logger.info(`Conectado como ${client.user?.tag}`);
    void client.lavalink.init({ id: client.user!.id, username: client.user!.username });
    startServer(client);
  });

  async function handleInteraction(interaction: Interaction): Promise<void> {
    if (!interaction.isChatInputCommand()) return;

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (error) {
      logger.error(`Erro ao executar /${interaction.commandName}:`, error);
      const payload = { content: '⚠️ Ocorreu um erro ao executar o comando.', ephemeral: true };
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  }

  client.on('interactionCreate', (interaction: Interaction) => {
    void handleInteraction(interaction);
  });

  async function shutdown(signal: string): Promise<void> {
    logger.info(`Recebido ${signal}, encerrando o bot...`);
    await client.destroy();
    process.exit(0);
  }
  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));

  await client.login(env.discordToken);
}

main().catch((error: unknown) => {
  logger.error('Falha ao iniciar o bot:', error);
  process.exit(1);
});
