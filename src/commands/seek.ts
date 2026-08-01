import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { formatDuration, parseTimeToMs } from '../lib/format.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('seek')
  .setDescription('Pula para um momento específico da música atual')
  .addStringOption((option) =>
    option.setName('tempo').setDescription('Tempo (ex: 90, 1:30 ou 1:02:03)').setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const tempo = interaction.options.getString('tempo', true);
  const player = getPlayer(interaction, client);
  if (!player || !player.queue.current) {
    return interaction.reply({ content: '❌ Não há música tocando.', ephemeral: true });
  }
  if (player.queue.current.info.isStream) {
    return interaction.reply({
      content: '❌ Não é possível pular tempo em uma transmissão ao vivo.',
      ephemeral: true,
    });
  }

  const positionMs = parseTimeToMs(tempo);
  if (positionMs === null) {
    return interaction.reply({ content: '❌ Formato inválido — use segundos ou `mm:ss`.', ephemeral: true });
  }

  await player.seek(positionMs);
  return interaction.reply(`⏩ Posição ajustada para **${formatDuration(positionMs)}**.`);
}

export const command = { data, execute } satisfies Command;
