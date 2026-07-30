import { ChannelType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import type { QueueMetadata } from '../types/queue.js';
import { BRAND_COLOR } from '../lib/embeds.js';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Toca uma música por busca ou URL')
  .addStringOption((option) =>
    option.setName('query').setDescription('Termo de busca ou URL da faixa/playlist').setRequired(true),
  );

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const query = interaction.options.getString('query', true);

  const member = await interaction.guild!.members.fetch(interaction.user.id);
  const voiceChannel = member.voice.channel;
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    return interaction.reply({ content: '❌ Você precisa estar em um canal de voz.', ephemeral: true });
  }

  await interaction.deferReply();

  const result = await client.player.search(query, { requestedBy: interaction.user });
  const firstTrack = result?.tracks[0];
  if (!result || !firstTrack) {
    return interaction.editReply('❌ Nenhum resultado encontrado.');
  }

  const queue = client.player.nodes.create<QueueMetadata>(interaction.guild!, {
    metadata: { channel: interaction.channel?.isSendable() ? interaction.channel : null },
    volume: 80,
    leaveOnEnd: true,
    leaveOnEndCooldown: 2000,
    leaveOnStop: true,
    leaveOnEmpty: true,
    leaveOnEmptyCooldown: 60_000,
  });

  if (!queue.connection) await queue.connect(voiceChannel);

  if (result.playlist) {
    queue.addTrack(result.tracks);
  } else {
    queue.addTrack(firstTrack);
  }

  if (!queue.node.isPlaying() && !queue.node.isPaused()) await queue.node.play();

  const embed = result.playlist
    ? new EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle('📑 Playlist adicionada à fila')
        .setDescription(
          `**[${result.playlist.title}](${result.playlist.url})** com ${result.tracks.length} faixas.`,
        )
        .setThumbnail(result.playlist.thumbnail || null)
        .setFooter({
          text: `Pedido por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        })
    : new EmbedBuilder()
        .setColor(BRAND_COLOR)
        .setTitle('🎵 Adicionado à fila')
        .setDescription(`**[${firstTrack.title}](${firstTrack.url})**`)
        .setThumbnail(firstTrack.thumbnail || null)
        .addFields(
          { name: 'Duração', value: firstTrack.duration, inline: true },
          { name: 'Autor', value: firstTrack.author, inline: true },
        )
        .setFooter({
          text: `Pedido por ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL(),
        });

  return interaction.editReply({ embeds: [embed] });
}

export const command = { data, execute } satisfies Command;
