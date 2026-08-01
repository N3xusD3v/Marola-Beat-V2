import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder()
  .setName('volume')
  .setDescription('Ajusta o volume da reprodução')
  .addIntegerOption((option) =>
    option
      .setName('nivel')
      .setDescription('Volume em % (0-100)')
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(100),
  );

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const nivel = interaction.options.getInteger('nivel', true);
  const player = getPlayer(interaction, client);
  if (!player) {
    return interaction.reply({ content: '❌ Nada está tocando no momento.', ephemeral: true });
  }

  await player.setVolume(nivel);
  return interaction.reply(`🔊 Volume ajustado para **${nivel}%**.`);
}

export const command = { data, execute } satisfies Command;
