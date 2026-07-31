import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { BRAND_COLOR } from '../lib/embeds.js';
import { getPlayer } from '../lib/queue.js';

export const data = new SlashCommandBuilder().setName('skip').setDescription('Pula a faixa atual');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player || !player.playing) {
    return interaction.reply({ content: '❌ Nada está tocando no momento.', ephemeral: true });
  }

  const current = player.queue.current;
  await player.skip();

  const embed = new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle('⏭️ Faixa pulada')
    .setDescription(
      current ? `Pulou **[${current.info.title}](${current.info.uri})**.` : 'Pulou para a próxima faixa.',
    );
  return interaction.reply({ embeds: [embed] });
}

export const command = { data, execute } satisfies Command;
