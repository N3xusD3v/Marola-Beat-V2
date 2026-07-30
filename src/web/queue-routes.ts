import { Router } from 'express';
import { ChannelType } from 'discord.js';
import type { Track } from 'discord-player';
import type { BotClient } from '../types/client.js';
import type { QueueMetadata } from '../types/queue.js';
import { env } from '../config/env.js';
import { requesterName } from '../lib/embeds.js';
import { logger } from '../lib/logger.js';
import { requireVoiceMember } from './middleware.js';

interface TrackDTO {
  id: string;
  title: string;
  author: string;
  url: string;
  duration: string;
  thumbnail: string | null;
  requestedBy: string;
}

function toDTO(track: Track): TrackDTO {
  return {
    id: track.id,
    title: track.title,
    author: track.author,
    url: track.url,
    duration: track.duration,
    thumbnail: track.thumbnail ?? null,
    requestedBy: requesterName(track),
  };
}

const MAX_QUERY_LENGTH = 300;

function stringField(body: unknown, field: string): string | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'string' ? value : undefined;
}

function numberField(body: unknown, field: string): number | undefined {
  if (typeof body !== 'object' || body === null) return undefined;
  const value = (body as Record<string, unknown>)[field];
  return typeof value === 'number' ? value : undefined;
}

export function createQueueRouter(client: BotClient) {
  const router = Router();
  router.use(requireVoiceMember(client));

  router.get('/', (req, res) => {
    const queue = client.player.nodes.get<QueueMetadata>(env.webGuildId);
    res.json({
      current: queue?.currentTrack ? toDTO(queue.currentTrack) : null,
      tracks: queue ? queue.tracks.toArray().map(toDTO) : [],
      paused: queue?.node.isPaused() ?? false,
    });
  });

  router.post('/add', (req, res) => {
    void (async () => {
      const query = (stringField(req.body, 'query') ?? '').trim();
      if (!query || query.length > MAX_QUERY_LENGTH) {
        res.status(400).json({ error: 'invalid_query' });
        return;
      }

      const guild = client.guilds.cache.get(env.webGuildId);
      const voiceChannel = guild?.channels.cache.get(req.voice!.voiceChannelId);
      if (!guild || !voiceChannel || voiceChannel.type !== ChannelType.GuildVoice) {
        res.status(409).json({ error: 'voice_channel_unavailable' });
        return;
      }

      try {
        // Busca o User real (não só o id salvo na sessão) para que o embed/DTO
        // mostre o nome de usuário corretamente em "Pedido por".
        const requestedBy = await client.users.fetch(req.session.user!.id).catch(() => undefined);
        const result = await client.player.search(query, { requestedBy });
        const firstTrack = result?.tracks[0];
        if (!result || !firstTrack) {
          res.status(404).json({ error: 'no_results' });
          return;
        }

        const queue = client.player.nodes.create<QueueMetadata>(guild, {
          metadata: { channel: null },
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

        res.status(201).json({
          addedPlaylist: Boolean(result.playlist),
          track: toDTO(firstTrack),
          count: result.playlist ? result.tracks.length : 1,
        });
      } catch (error) {
        logger.error('Erro ao adicionar música via web:', error);
        res.status(500).json({ error: 'add_failed' });
      }
    })();
  });

  router.post('/move', (req, res) => {
    const index = numberField(req.body, 'index');
    const direction = stringField(req.body, 'direction');
    if (index === undefined || !Number.isInteger(index) || (direction !== 'up' && direction !== 'down')) {
      res.status(400).json({ error: 'invalid_move' });
      return;
    }

    const queue = client.player.nodes.get<QueueMetadata>(env.webGuildId);
    const size = queue?.tracks.size ?? 0;
    const target = direction === 'up' ? index - 1 : index + 1;

    if (!queue || index < 0 || index >= size || target < 0 || target >= size) {
      res.status(400).json({ error: 'out_of_range' });
      return;
    }

    queue.node.swap(index, target);
    res.status(204).end();
  });

  return router;
}
