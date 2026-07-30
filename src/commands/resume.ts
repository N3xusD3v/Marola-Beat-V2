import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getQueue } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Retoma a música se estiver pausada');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const queue = getQueue(interaction, client);
  if (!queue || !queue.node.isPaused()) {
    return interaction.reply({ content: '❌ Não há música pausada para retomar.', ephemeral: true });
  }
  queue.node.resume();
  return interaction.reply('▶️ Música retomada.');
}

export const command = { data, execute } satisfies Command;
