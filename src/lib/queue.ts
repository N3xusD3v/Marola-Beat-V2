import type { ChatInputCommandInteraction } from 'discord.js';
import type { GuildQueue } from 'discord-player';
import type { BotClient } from '../types/client.js';
import type { QueueMetadata } from '../types/queue.js';

/** Retorna a fila de reprodução ativa da guild atual, ou `null` se não houver. */
export function getQueue(
  interaction: ChatInputCommandInteraction,
  client: BotClient,
): GuildQueue<QueueMetadata> | null {
  if (!interaction.guildId) return null;
  return client.player.nodes.get<QueueMetadata>(interaction.guildId) ?? null;
}
