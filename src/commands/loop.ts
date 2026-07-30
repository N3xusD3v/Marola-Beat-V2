import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import { QueueRepeatMode } from 'discord-player';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getQueue } from '../lib/queue.js';

const REPEAT_MODES = {
  off: { mode: QueueRepeatMode.OFF, message: '🔁 Repetição desativada.' },
  track: { mode: QueueRepeatMode.TRACK, message: '🔂 Repetição de faixa ativada.' },
  queue: { mode: QueueRepeatMode.QUEUE, message: '🔁 Repetição da fila ativada.' },
} as const;

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
  const mode = interaction.options.getString('mode', true) as keyof typeof REPEAT_MODES;
  const queue = getQueue(interaction, client);
  if (!queue || !queue.currentTrack) {
    return interaction.reply({ content: '❌ Não há música tocando.', ephemeral: true });
  }

  const { mode: repeatMode, message } = REPEAT_MODES[mode];
  queue.setRepeatMode(repeatMode);
  return interaction.reply(message);
}

export const command = { data, execute } satisfies Command;
