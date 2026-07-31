import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Para a reprodução e limpa a fila');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player) {
    return interaction.reply({ content: '❌ Nada está tocando no momento.', ephemeral: true });
  }
  await player.destroy();
  return interaction.reply('⏹️ Reprodução parada e fila limpa.');
}

export const command = { data, execute } satisfies Command;
