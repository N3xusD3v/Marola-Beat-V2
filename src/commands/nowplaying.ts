import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { trackEmbed } from '../lib/embeds.js';
import { getQueue } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Mostra a faixa que está tocando no momento');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const queue = getQueue(interaction, client);
  if (!queue || !queue.currentTrack) {
    return interaction.reply({ content: '❌ Nada está tocando no momento.', ephemeral: true });
  }
  return interaction.reply({ embeds: [trackEmbed('🎧 Tocando agora', queue.currentTrack)] });
}

export const command = { data, execute } satisfies Command;
