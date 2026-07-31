import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Retoma a música se estiver pausada');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player || !player.paused) {
    return interaction.reply({ content: '❌ Não há música pausada para retomar.', ephemeral: true });
  }
  await player.resume();
  return interaction.reply('▶️ Música retomada.');
}

export const command = { data, execute } satisfies Command;
