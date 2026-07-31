import { EmbedBuilder } from 'discord.js';
import type { Client } from 'discord.js';
import { Player } from 'discord-player';
import type { GuildQueue } from 'discord-player';
import { DefaultExtractors } from '@discord-player/extractor';
import { YoutubeiExtractor } from 'discord-player-youtubei';
import { ERROR_COLOR, trackEmbed } from './embeds.js';
import { logger } from './logger.js';
import type { QueueMetadata } from '../types/queue.js';

/** Cria e configura a instância do Player, registrando extractors e listeners de eventos. */
export async function createPlayer(client: Client): Promise<Player> {
  const player = new Player(client);

  await player.extractors.loadMulti(DefaultExtractors);
  await player.extractors.register(YoutubeiExtractor, {});

  player.events.on('playerStart', (queue: GuildQueue<QueueMetadata>, track) => {
    void queue.metadata.channel?.send({ embeds: [trackEmbed('🎶 Tocando agora', track)] }).catch(() => {});
  });

  player.events.on('error', (queue: GuildQueue<QueueMetadata>, error) => {
    logger.error('Erro no player:', error);
    const embed = new EmbedBuilder()
      .setColor(ERROR_COLOR)
      .setTitle('⚠️ Erro no player')
      .setDescription(String(error).slice(0, 200));
    void queue.metadata.channel?.send({ embeds: [embed] }).catch(() => {});
  });

  player.events.on('playerError', (queue, error) => {
    logger.error('Erro interno do player:', error);
  });

  player.events.on('disconnect', (queue) => {
    logger.info(`Desconectado do canal de voz na guild ${queue.guild?.id}`);
  });

  player.events.on('emptyChannel', (queue) => {
    logger.info(`Canal de voz vazio, saindo em breve na guild ${queue.guild?.id}`);
  });

  player.events.on('emptyQueue', (queue) => {
    logger.info(`Fila vazia na guild ${queue.guild?.id}`);
  });

  // Só produz saída com LOG_LEVEL=debug; útil para diagnosticar handshake de voz
  // (WS -> UDP discovery -> Ready) quando a conexão trava/aborta silenciosamente.
  player.events.on('debug', (queue, message) => {
    logger.debug(`[queue ${queue.guild?.id}] ${message}`);
  });

  return player;
}
