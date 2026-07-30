import { EmbedBuilder } from 'discord.js';
import type { Track } from 'discord-player';

export const BRAND_COLOR = 0x1db954;
export const ERROR_COLOR = 0xed4245;

export function requesterName(track: Track): string {
  const requester = track.requestedBy;
  if (!requester) return 'Desconhecido';
  return requester.tag ?? requester.username ?? requester.id;
}

export function trackEmbed(title: string, track: Track): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(BRAND_COLOR)
    .setTitle(title)
    .setDescription(`**[${track.title}](${track.url})**`)
    .setThumbnail(track.thumbnail || null)
    .addFields(
      { name: 'Duração', value: track.duration, inline: true },
      { name: 'Autor', value: track.author, inline: true },
      { name: 'Pedido por', value: requesterName(track), inline: true },
    )
    .setFooter({ text: 'Aproveite a música!' });
}
