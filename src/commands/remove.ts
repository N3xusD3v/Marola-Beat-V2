import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('remove')
  .setDescription('Remove uma música da fila pela posição')
  .addIntegerOption((option) =>
    option
      .setName('posicao')
      .setDescription('Posição na fila (veja /queue)')
      .setRequired(true)
      .setMinValue(1),
  );

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const posicao = interaction.options.getInteger('posicao', true);
  const player = getPlayer(interaction, client);
  const index = posicao - 1;

  if (!player || index < 0 || index >= player.queue.tracks.length) {
    return interaction.reply({ content: '❌ Posição inválida — confira com `/queue`.', ephemeral: true });
  }

  const track = player.queue.tracks[index];
  await player.queue.splice(index, 1);
  return interaction.reply(`🗑️ Removida: **${track?.info.title ?? 'faixa desconhecida'}**.`);
}

export const command = { data, execute } satisfies Command;
