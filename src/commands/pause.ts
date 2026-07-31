import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder().setName('pause').setDescription('Pausa a música atual');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player || !player.playing) {
    return interaction.reply({ content: '❌ Nenhuma música está tocando.', ephemeral: true });
  }
  if (player.paused) {
    return interaction.reply({ content: '⏸️ A música já está pausada.', ephemeral: true });
  }
  await player.pause();
  return interaction.reply('⏸️ Música pausada.');
}

export const command = { data, execute } satisfies Command;
