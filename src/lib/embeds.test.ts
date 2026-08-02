import { describe, expect, it } from 'vitest';
import type { Track } from 'lavalink-client';
import { requesterName } from './embeds.js';

function trackWithRequester(requester: Track['requester']): Track {
  return { requester } as unknown as Track;
}

describe('requesterName', () => {
  it('retorna "Desconhecido" quando não há requester', () => {
    expect(requesterName(trackWithRequester(undefined))).toBe('Desconhecido');
  });

  it('retorna o displayName do requester quando presente', () => {
    const track = trackWithRequester({
      id: '123',
      displayName: 'Samurai',
      displayAvatarURL: () => '',
    });
    expect(requesterName(track)).toBe('Samurai');
  });

  it('cai para o id quando displayName não vem preenchido', () => {
    const track = trackWithRequester({
      id: '123',
      displayAvatarURL: () => '',
    } as unknown as Track['requester']);
    expect(requesterName(track)).toBe('123');
  });
});
