import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { getQueue } from '../lib/queue.js';

const MAX_TRACKS_SHOWN = 10;

export const data = new SlashCommandBuilder().setName('queue').setDescription('Mostra a fila de reprodução');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const queue = getQueue(interaction, client);
  if (!queue || queue.tracks.size === 0) {
    return interaction.reply({ content: '📭 A fila está vazia.', ephemeral: true });
  }

  const tracks = queue.tracks.toArray();
  const current = queue.currentTrack;

  let response = '🎶 **Fila atual:**\n';
  if (current) {
    response += `Tocando agora: **${current.title}** [${current.duration}]\n\n`;
  }

  response += tracks
    .slice(0, MAX_TRACKS_SHOWN)
    .map((track, index) => `${index + 1}. ${track.title} [${track.duration}]`)
    .join('\n');

  if (tracks.length > MAX_TRACKS_SHOWN) {
    response += `\n... e mais ${tracks.length - MAX_TRACKS_SHOWN}.`;
  }

  return interaction.reply(response);
}

export const command = { data, execute } satisfies Command;
