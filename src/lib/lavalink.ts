import { EmbedBuilder } from 'discord.js';
import { LavalinkManager } from 'lavalink-client';
import { env } from '../config/env.js';
import { ERROR_COLOR, trackEmbed } from './embeds.js';
import { logger } from './logger.js';
import type { BotClient } from '../types/client.js';

/**
 * Cria e configura o LavalinkManager, registrando listeners de eventos.
 * A conexão de voz (UDP) com o Discord acontece no node Lavalink, não neste processo —
 * veja lavalink/application.yml e o serviço `lavalink` no docker-compose.yml.
 */
const CAPACITY_LOG_INTERVAL_MS = 5 * 60 * 1000;

export function createLavalinkManager(client: BotClient): LavalinkManager {
  const manager = new LavalinkManager({
    nodes: [
      {
        id: 'main',
        host: env.lavalinkHost,
        port: env.lavalinkPort,
        authorization: env.lavalinkPassword,
      },
    ],
    sendToShard: (guildId, payload) => client.guilds.cache.get(guildId)?.shard.send(payload),
    client: { id: env.discordAppId },
    autoSkip: true,
    playerOptions: {
      defaultSearchPlatform: 'ytsearch',
      onEmptyQueue: { destroyAfterMs: 60_000 },
      onDisconnect: { autoReconnect: false, destroyPlayer: true },
    },
  });

  manager.on('trackStart', (player, track) => {
    if (!track) return;
    const channel = player.textChannelId ? client.channels.cache.get(player.textChannelId) : undefined;
    if (channel?.isSendable()) {
      void channel.send({ embeds: [trackEmbed('🎶 Tocando agora', track)] }).catch(() => {});
    }
    logger.info(`Tocando "${track.info.title}" na guild ${player.guildId}`);
  });

  manager.on('trackError', (player, track, payload) => {
    logger.error(`Erro na faixa "${track?.info.title ?? 'desconhecida'}":`, payload.exception);
    const channel = player.textChannelId ? client.channels.cache.get(player.textChannelId) : undefined;
    if (channel?.isSendable()) {
      const errorMsg = payload.exception?.message ?? 'Erro desconhecido';
      let userMessage = '⚠️ Erro na faixa';
      let description = errorMsg.slice(0, 200);

      if (errorMsg.includes('This video requires login')) {
        userMessage = '🔒 Vídeo restrito';
        description = 'Este vídeo requer login. Pode ser conteúdo com restrição de idade ou regional.';
      } else if (errorMsg.includes('sign in to confirm')) {
        userMessage = '🚫 Verificação necessária';
        description = 'O YouTube está solicitando verificação. Tente novamente em alguns minutos.';
      } else if (errorMsg.includes('Video unavailable')) {
        userMessage = '❌ Vídeo indisponível';
        description = 'Este vídeo não está disponível. Pode ter sido removido ou bloqueado.';
      } else if (errorMsg.includes('not available in your country')) {
        userMessage = '🌍 Bloqueio regional';
        description = 'Este conteúdo não está disponível na sua região.';
      }

      const embed = new EmbedBuilder().setColor(ERROR_COLOR).setTitle(userMessage).setDescription(description);
      void channel.send({ embeds: [embed] }).catch(() => {});
    }
  });

  manager.on('playerDestroy', (player, reason) => {
    logger.info(`Player destruído na guild ${player.guildId} (${reason ?? 'sem motivo'})`);
  });

  manager.nodeManager.on('connect', (node) => {
    logger.info(`Conectado ao node Lavalink "${node.id}"`);
  });

  manager.nodeManager.on('error', (node, error) => {
    logger.error(`Erro no node Lavalink "${node.id}":`, error);
  });

  manager.nodeManager.on('disconnect', (node, reason) => {
    logger.warn(`Desconectado do node Lavalink "${node.id}": ${JSON.stringify(reason)}`);
  });

  if (env.logLevel === 'debug') {
    manager.on('debug', (moduleName, info) => {
      logger.debug(`[lavalink:${moduleName}] ${JSON.stringify(info)}`);
    });
  }

  // Sinal de "hora de escalar pra mais de um node" (issue #30) — lavalink-client já suporta múltiplos
  // nodes nativamente (só adicionar entradas em `nodes` acima), só falta saber quando. `node.stats` é
  // mantido atualizado pelo próprio Lavalink via um intervalo interno, então só precisamos ler e logar.
  const capacityLogInterval = setInterval(() => {
    for (const node of manager.nodeManager.nodes.values()) {
      if (!node.connected) continue;
      const { players, playingPlayers, cpu } = node.stats;
      logger.info(
        `Capacidade do node Lavalink "${node.id}": ${playingPlayers}/${players} players tocando, ` +
          `CPU sistema ${(cpu.systemLoad * 100).toFixed(1)}%, CPU Lavalink ${(cpu.lavalinkLoad * 100).toFixed(1)}%`,
      );
    }
  }, CAPACITY_LOG_INTERVAL_MS);
  capacityLogInterval.unref();

  return manager;
}
