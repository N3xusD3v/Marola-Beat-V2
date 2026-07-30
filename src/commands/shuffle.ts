import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getQueue } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('shuffle')
  .setDescription('Embaralha as músicas da fila');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const queue = getQueue(interaction, client);
  if (!queue || queue.tracks.size < 2) {
    return interaction.reply({
      content: '❌ Não há músicas suficientes na fila para embaralhar.',
      ephemeral: true,
    });
  }
  queue.tracks.shuffle();
  return interaction.reply('🔀 Fila embaralhada.');
}

export const command = { data, execute } satisfies Command;
