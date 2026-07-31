import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('clear')
  .setDescription('Limpa a fila sem parar a música atual');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player || player.queue.tracks.length === 0) {
    return interaction.reply({ content: '📭 A fila já está vazia.', ephemeral: true });
  }

  const count = player.queue.tracks.length;
  await player.queue.splice(0, count);
  return interaction.reply(`🧹 Fila limpa — ${count} música(s) removida(s).`);
}

export const command = { data, execute } satisfies Command;
