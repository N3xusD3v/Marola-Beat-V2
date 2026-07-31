import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { trackEmbed } from '../lib/embeds.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('nowplaying')
  .setDescription('Mostra a faixa que está tocando no momento');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player || !player.queue.current) {
    return interaction.reply({ content: '❌ Nada está tocando no momento.', ephemeral: true });
  }
  return interaction.reply({ embeds: [trackEmbed('🎧 Tocando agora', player.queue.current)] });
}

export const command = { data, execute } satisfies Command;
