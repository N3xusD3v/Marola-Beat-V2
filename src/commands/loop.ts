import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { RepeatMode } from 'lavalink-client';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getPlayer } from '../lib/queue.js';

const REPEAT_MESSAGES: Record<RepeatMode, string> = {
  off: '🔁 Repetição desativada.',
  track: '🔂 Repetição de faixa ativada.',
  queue: '🔁 Repetição da fila ativada.',
};

export const data = new SlashCommandBuilder()
  .setName('loop')
  .setDescription('Define o modo de repetição da fila ou música atual')
  .addStringOption((option) =>
    option
      .setName('mode')
      .setDescription('Modo de repetição')
      .setRequired(true)
      .addChoices(
        { name: 'Desativado', value: 'off' },
        { name: 'Faixa atual', value: 'track' },
        { name: 'Fila inteira', value: 'queue' },
      ),
  );

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const mode = interaction.options.getString('mode', true) as RepeatMode;
  const player = getPlayer(interaction, client);
  if (!player || !player.queue.current) {
    return interaction.reply({ content: '❌ Não há música tocando.', ephemeral: true });
  }

  await player.setRepeatMode(mode);
  return interaction.reply(REPEAT_MESSAGES[mode]);
}

export const command = { data, execute } satisfies Command;
