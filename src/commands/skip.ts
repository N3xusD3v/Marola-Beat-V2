import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { BRAND_COLOR } from '../lib/embeds.js';
import { getQueue } from '../lib/queue.js';

export const data = new SlashCommandBuilder().setName('skip').setDescription('Pula a faixa atual');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const queue = getQueue(interaction, client);
  if (!queue || !queue.node.isPlaying()) {
    return interaction.reply({ content: '❌ Nada está tocando no momento.', ephemeral: true });
  }

  const current = queue.currentTrack;
  queue.node.skip();

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('⏭️ Faixa pulada')
    .setDescription(
      current ? `Pulou **[${current.title}](${current.url})**.` : 'Pulou para a próxima faixa.',
    );
  return interaction.reply({ embeds: [embed] });
}

export const command = { data, execute } satisfies Command;
