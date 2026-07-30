import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getQueue } from '../lib/queue.js';

export const data = new SlashCommandBuilder().setName('pause').setDescription('Pausa a música atual');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const queue = getQueue(interaction, client);
  if (!queue || !queue.node.isPlaying()) {
    return interaction.reply({ content: '❌ Nenhuma música está tocando.', ephemeral: true });
  }
  if (queue.node.isPaused()) {
    return interaction.reply({ content: '⏸️ A música já está pausada.', ephemeral: true });
  }
  queue.node.pause();
  return interaction.reply('⏸️ Música pausada.');
}

export const command = { data, execute } satisfies Command;
