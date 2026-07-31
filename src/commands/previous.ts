import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('previous')
  .setDescription('Volta e toca a música anterior');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player || player.queue.previous.length === 0) {
    return interaction.reply({ content: '❌ Não há música anterior na fila.', ephemeral: true });
  }

  const previous = await player.queue.shiftPrevious();
  await player.play({ clientTrack: previous });
  return interaction.reply(`⏮️ Voltando para **${previous.info.title}**.`);
}

export const command = { data, execute } satisfies Command;
