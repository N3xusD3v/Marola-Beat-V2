import type { ChatInputCommandInteraction } from 'discord.js';
import type { Player } from 'lavalink-client';
import type { BotClient } from '../types/client.js';

/** Retorna o player de reprodução ativo da guild atual, ou `null` se não houver. */
export function getPlayer(interaction: ChatInputCommandInteraction, client: BotClient): Player | null {
  if (!interaction.guildId) return null;
  return client.lavalink.getPlayer(interaction.guildId) ?? null;
}
