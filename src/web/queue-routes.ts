import { Router } from 'express';
import type { SearchResult, Track, UnresolvedTrack } from 'lavalink-client';
import type { BotClient } from '../types/client.js';
import { requesterName } from '../lib/embeds.js';
import { recordGuildActivity, touchUser } from '../lib/admin-store.js';
import type { RedisClient } from '../lib/admin-store.js';
import { formatDuration } from '../lib/format.js';
import { logger } from '../lib/logger.js';
import { booleanField, numberField, stringField } from './body-fields.js';
import { requireVoiceMember } from './middleware.js';

interface TrackDTO {
  id: string;
  title: string;
  author: string;
  url: string;
  duration: string;
  durationMs: number;
  isStream: boolean;
  thumbnail: string | null;
  requestedBy: string;
}

function toDTO(track: Track | UnresolvedTrack): TrackDTO {
  const durationMs = track.info.duration ?? 0;
  return {
    id: track.info.identifier ?? track.info.title,
    title: track.info.title,
    author: track.info.author ?? 'Desconhecido',
    url: track.info.uri ?? '',
    duration: track.info.isStream ? 'AO VIVO' : formatDuration(durationMs),
    durationMs,
    isStream: track.info.isStream ?? false,
    thumbnail: track.info.artworkUrl ?? null,
    requestedBy: requesterName(track),
  };
}

const MAX_QUERY_LENGTH = 300;

export function createQueueRouter(client: BotClient, redis: RedisClient) {
  const router = Router();
  router.use(requireVoiceMember(client));
  // "Última atividade" do servidor no painel /admin — não bloqueia a resposta (fire-and-forget),
  // já que é só estatística, não deve adicionar latência a nenhuma ação da fila.
  router.use((req, res, next) => {
    const user = req.session.user!;
    const guildId = req.voice!.guildId;
    // Sem fetch() aqui de propósito: essa rota é atingida a cada poll de 4s, então usar só o
    // cache evita bater na API REST do Discord numa rota tão frequente — o GuildMember já deve
    // estar em cache pelo próprio evento de voice state que fez requireVoiceMember passar.
    const displayName = client.guilds.cache.get(guildId)?.members.cache.get(user.id)?.displayName;
    recordGuildActivity(redis, guildId, user.id).catch((error: unknown) => {
      logger.error('Erro ao registrar atividade do servidor para o painel admin:', error);
    });
    touchUser(redis, { ...user, displayName: displayName ?? user.username }).catch((error: unknown) => {
      logger.error('Erro ao registrar atividade do usuário para o painel admin:', error);
    });
    next();
  });

  router.get('/', (req, res) => {
    const player = client.lavalink.getPlayer(req.voice!.guildId);
    res.json({
      current: player?.queue.current ? toDTO(player.queue.current) : null,
      positionMs: player?.position ?? 0,
      tracks: player ? player.queue.tracks.map(toDTO) : [],
      playing: player?.playing ?? false,
      paused: player?.paused ?? false,
      volume: player?.volume ?? 100,
      hasPrevious: (player?.queue.previous.length ?? 0) > 0,
    });
  });

  router.post('/add', (req, res) => {
    void (async () => {
      const query = (stringField(req.body, 'query') ?? '').trim();
      if (!query || query.length > MAX_QUERY_LENGTH) {
        res.status(400).json({ error: 'invalid_query' });
        return;
      }
      const playNext = booleanField(req.body, 'playNext');

      const guild = client.guilds.cache.get(req.voice!.guildId);
      const voiceChannelId = req.voice!.voiceChannelId;
      if (!guild || !guild.channels.cache.has(voiceChannelId)) {
        res.status(409).json({ error: 'voice_channel_unavailable' });
        return;
      }

      try {
        // Busca o GuildMember (não o User global) pra que "Pedido por" mostre o apelido do
        // servidor/nome de exibição, não o @username da conta.
        const requestedBy = await guild.members.fetch(req.session.user!.id).catch(() => undefined);

        const player = client.lavalink.createPlayer({
          guildId: guild.id,
          voiceChannelId,
          selfDeaf: true,
        });
        if (!player.connected) await player.connect();

        // useUnresolvedData isn't enabled, so search() always resolves to SearchResult.
        const result = (await player.search({ query }, requestedBy)) as SearchResult;
        if (result.loadType === 'error' || result.loadType === 'empty') {
          res.status(404).json({ error: 'no_results' });
          return;
        }

        const firstTrack = result.tracks[0];
        if (!firstTrack) {
          res.status(404).json({ error: 'no_results' });
          return;
        }

        if (result.loadType === 'playlist') {
          await player.queue.add(result.tracks, playNext ? 0 : undefined);
        } else {
          await player.queue.add(firstTrack, playNext ? 0 : undefined);
        }

        if (!player.playing && !player.paused) await player.play();

        res.status(201).json({
          addedPlaylist: result.loadType === 'playlist',
          track: toDTO(firstTrack),
          count: result.loadType === 'playlist' ? result.tracks.length : 1,
        });
      } catch (error) {
        logger.error('Erro ao adicionar música via web:', error);
        res.status(500).json({ error: 'add_failed' });
      }
    })();
  });

  router.post('/move', (req, res) => {
    void (async () => {
      const index = numberField(req.body, 'index');
      const direction = stringField(req.body, 'direction');
      if (index === undefined || !Number.isInteger(index) || (direction !== 'up' && direction !== 'down')) {
        res.status(400).json({ error: 'invalid_move' });
        return;
      }

      const player = client.lavalink.getPlayer(req.voice!.guildId);
      const size = player?.queue.tracks.length ?? 0;
      const target = direction === 'up' ? index - 1 : index + 1;

      if (!player || index < 0 || index >= size || target < 0 || target >= size) {
        res.status(400).json({ error: 'out_of_range' });
        return;
      }

      const start = Math.min(index, target);
      const first = player.queue.tracks[start];
      const second = player.queue.tracks[start + 1];
      if (!first || !second) {
        res.status(400).json({ error: 'out_of_range' });
        return;
      }

      await player.queue.splice(start, 2, [second, first]);
      res.status(204).end();
    })();
  });

  router.post('/move-to-top', (req, res) => {
    void (async () => {
      const index = numberField(req.body, 'index');
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      const size = player?.queue.tracks.length ?? 0;

      if (index === undefined || !Number.isInteger(index) || !player || index < 0 || index >= size) {
        res.status(400).json({ error: 'out_of_range' });
        return;
      }

      if (index > 0) {
        const track = player.queue.tracks[index];
        if (!track) {
          res.status(400).json({ error: 'out_of_range' });
          return;
        }
        await player.queue.splice(index, 1);
        await player.queue.splice(0, 0, track);
      }

      res.status(204).end();
    })();
  });

  router.post('/remove', (req, res) => {
    void (async () => {
      const index = numberField(req.body, 'index');
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      const size = player?.queue.tracks.length ?? 0;

      if (index === undefined || !Number.isInteger(index) || !player || index < 0 || index >= size) {
        res.status(400).json({ error: 'out_of_range' });
        return;
      }

      await player.queue.splice(index, 1);
      res.status(204).end();
    })();
  });

  router.post('/pause', (req, res) => {
    void (async () => {
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      // `player.playing` is false while paused, so guard on the current track instead.
      if (!player || !player.queue.current) {
        res.status(409).json({ error: 'nothing_playing' });
        return;
      }
      if (player.paused) {
        await player.resume();
      } else {
        await player.pause();
      }
      res.status(204).end();
    })();
  });

  router.post('/skip', (req, res) => {
    void (async () => {
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      if (!player || !player.queue.current) {
        res.status(409).json({ error: 'nothing_playing' });
        return;
      }
      await player.skip();
      res.status(204).end();
    })();
  });

  router.post('/previous', (req, res) => {
    void (async () => {
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      if (!player || player.queue.previous.length === 0) {
        res.status(409).json({ error: 'no_previous' });
        return;
      }
      const previous = await player.queue.shiftPrevious();
      await player.play({ clientTrack: previous });
      res.status(204).end();
    })();
  });

  router.post('/clear', (req, res) => {
    void (async () => {
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      if (!player || player.queue.tracks.length === 0) {
        res.status(409).json({ error: 'queue_empty' });
        return;
      }
      await player.queue.splice(0, player.queue.tracks.length);
      res.status(204).end();
    })();
  });

  router.post('/volume', (req, res) => {
    void (async () => {
      const volume = numberField(req.body, 'volume');
      if (volume === undefined || !Number.isInteger(volume) || volume < 0 || volume > 100) {
        res.status(400).json({ error: 'invalid_volume' });
        return;
      }
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      if (!player) {
        res.status(409).json({ error: 'nothing_playing' });
        return;
      }
      await player.setVolume(volume);
      res.status(204).end();
    })();
  });

  router.post('/seek', (req, res) => {
    void (async () => {
      const positionMs = numberField(req.body, 'positionMs');
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      if (!player || !player.queue.current) {
        res.status(409).json({ error: 'nothing_playing' });
        return;
      }
      if (player.queue.current.info.isStream) {
        res.status(409).json({ error: 'not_seekable' });
        return;
      }
      if (positionMs === undefined || positionMs < 0) {
        res.status(400).json({ error: 'invalid_position' });
        return;
      }
      await player.seek(positionMs);
      res.status(204).end();
    })();
  });

  router.post('/leave', (req, res) => {
    void (async () => {
      const player = client.lavalink.getPlayer(req.voice!.guildId);
      if (!player) {
        res.status(409).json({ error: 'not_connected' });
        return;
      }
      await player.destroy();
      res.status(204).end();
    })();
  });

  return router;
}
