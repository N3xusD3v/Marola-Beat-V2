import { SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { formatDuration } from '../lib/format.js';
import { getPlayer } from '../lib/queue.js';

const MAX_TRACKS_SHOWN = 10;

export const data = new SlashCommandBuilder().setName('queue').setDescription('Mostra a fila de reprodução');

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const player = getPlayer(interaction, client);
  if (!player || player.queue.tracks.length === 0) {
    return interaction.reply({ content: '📭 A fila está vazia.', ephemeral: true });
  }

  const tracks = player.queue.tracks;
  const current = player.queue.current;

  let response = '🎶 **Fila atual:**\n';
  if (current) {
    response += `Tocando agora: **${current.info.title}** [${current.info.isStream ? 'AO VIVO' : formatDuration(current.info.duration)}]\n\n`;
  }

  response += tracks
    .slice(0, MAX_TRACKS_SHOWN)
    .map((track, index) => {
      const duration = track.info.isStream ? 'AO VIVO' : formatDuration(track.info.duration ?? 0);
      return `${index + 1}. ${track.info.title} [${duration}]`;
    })
    .join('\n');

  if (tracks.length > MAX_TRACKS_SHOWN) {
    response += `\n... e mais ${tracks.length - MAX_TRACKS_SHOWN}.`;
  }

  return interaction.reply(response);
}

export const command = { data, execute } satisfies Command;
