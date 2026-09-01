import { ChannelType, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import type { ChatInputCommandInteraction } from 'discord.js';
import type { BotClient } from '../types/client.js';
import type { Command } from '../types/command.js';
import { BRAND_COLOR } from '../lib/embeds.js';
import { formatDuration } from '../lib/format.js';
import { RateLimiter } from '../lib/rate-limiter.js';
import { searchWithFallback } from '../lib/search.js';

// Rate limiting mais generoso para uso restrito (você + amigos no mesmo canal)
// 10 requisições por minuto é mais confortável para uso pessoal
const playRateLimiter = new RateLimiter(10, 60);

setInterval(() => playRateLimiter.cleanup(), 5 * 60 * 1000);

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Toca uma música por busca ou URL')
  .addStringOption((option) =>
    option.setName('query').setDescription('Termo de busca ou URL da faixa/playlist').setRequired(true),
  )
  .addBooleanOption((option) =>
    option.setName('topo').setDescription('Adiciona no topo da fila (toca a seguir) em vez do final'),
  );

export async function execute(interaction: ChatInputCommandInteraction, client: BotClient) {
  const query = interaction.options.getString('query', true);
  const playNext = interaction.options.getBoolean('topo') ?? false;

  if (!playRateLimiter.check(interaction.user.id)) {
    const waitTime = playRateLimiter.getWaitTime(interaction.user.id);
    return interaction.reply({
      content: `⏱️ Calma aí! Aguarde ${waitTime} segundo${waitTime > 1 ? 's' : ''} antes de buscar outra música.`,
      ephemeral: true,
    });
  }

  const member = await interaction.guild!.members.fetch(interaction.user.id);
  const voiceChannel = member.voice.channel;
  if (!voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
    return interaction.reply({ content: '❌ Você precisa estar em um canal de voz.', ephemeral: true });
  }

  await interaction.deferReply();

  const player = client.lavalink.createPlayer({
    guildId: interaction.guild!.id,
    voiceChannelId: voiceChannel.id,
    textChannelId: interaction.channelId,
    selfDeaf: true,
  });

  if (!player.connected) await player.connect();

  // Passa o GuildMember (não o User) como requester pra "Pedido por" mostrar o apelido do
  // servidor, não o @username da conta. searchWithFallback já cai pro Tidal se o SoundCloud
  // não achar nada (ver src/lib/search.ts).
  const result = await searchWithFallback(player, query, member);
  if (result.loadType === 'error') {
    const errorMsg = result.exception?.message ?? '';
    if (errorMsg.includes('sign in') || errorMsg.includes('login')) {
      return interaction.editReply(
        '🔒 Este conteúdo requer autenticação. Pode ser restrito por idade ou região.',
      );
    }
    return interaction.editReply('❌ Erro ao buscar música. Tente outro termo ou URL.');
  }
  if (result.loadType === 'empty') {
    return interaction.editReply('❌ Nenhum resultado encontrado.');
  }

  const firstTrack = result.tracks[0];
  if (!firstTrack) {
    return interaction.editReply('❌ Nenhum resultado encontrado.');
  }

  if (result.loadType === 'playlist') {
    await player.queue.add(result.tracks, playNext ? 0 : undefined);
  } else {
    await player.queue.add(firstTrack, playNext ? 0 : undefined);
  }

  if (!player.playing && !player.paused) await player.play();

  const embed =
    result.loadType === 'playlist' && result.playlist
      ? new EmbedBuilder()
          .setColor(BRAND_COLOR)
          .setTitle('📑 Playlist adicionada à fila')
          .setDescription(
            `**[${result.playlist.name}](${result.playlist.uri ?? ''})** com ${result.tracks.length} faixas.`,
          )
          .setThumbnail(result.playlist.thumbnail ?? null)
          .setFooter({
            text: `Pedido por ${member.displayName}`,
            iconURL: member.displayAvatarURL(),
          })
      : new EmbedBuilder()
          .setColor(BRAND_COLOR)
          .setTitle('🎵 Adicionado à fila')
          .setDescription(`**[${firstTrack.info.title}](${firstTrack.info.uri})**`)
          .setThumbnail(firstTrack.info.artworkUrl)
          .addFields(
            {
              name: 'Duração',
              value: firstTrack.info.isStream ? 'AO VIVO' : formatDuration(firstTrack.info.duration),
              inline: true,
            },
            { name: 'Autor', value: firstTrack.info.author, inline: true },
          )
          .setFooter({
            text: `Pedido por ${member.displayName}`,
            iconURL: member.displayAvatarURL(),
          });

  return interaction.editReply({ embeds: [embed] });
}

export const command = { data, execute } satisfies Command;
