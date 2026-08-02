import { EmbedBuilder } from 'discord.js';
import type { Track, UnresolvedTrack } from 'lavalink-client';
import { formatDuration } from './format.js';

export const BRAND_COLOR = 0x1db954;
export const ERROR_COLOR = 0xed4245;

export function requesterName(track: Track | UnresolvedTrack): string {
  const requester = track.requester;
  if (!requester) return 'Desconhecido';
  return requester.displayName ?? requester.id;
}

export function trackEmbed(title: string, track: Track): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setDescription(`**[${track.info.title}](${track.info.uri})**`)
    .setThumbnail(track.info.artworkUrl)
    .addFields(
      {
        name: 'Duração',
        value: track.info.isStream ? 'AO VIVO' : formatDuration(track.info.duration),
        inline: true,
      },
      { name: 'Autor', value: track.info.author, inline: true },
      { name: 'Pedido por', value: requesterName(track), inline: true },
    )
    .setFooter({ text: 'Aproveite a música!' });
}
