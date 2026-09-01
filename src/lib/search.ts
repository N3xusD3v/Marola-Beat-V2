import type { GuildMember } from 'discord.js';
import type { Player, SearchResult } from 'lavalink-client';

// Prefixo de fonte explícito (ex: "scsearch:", "tdsearch:") ou URL direta — o usuário já
// escolheu a fonte de propósito, não faz sentido cair no fallback nesses casos.
const EXPLICIT_SOURCE_PATTERN = /^(https?:\/\/|\w+search:|\w+isrc:)/i;

function isEmptyOrError(result: SearchResult): boolean {
  return result.loadType === 'empty' || result.loadType === 'error';
}

/**
 * Busca a query na fonte padrão (SoundCloud, via defaultSearchPlatform em lib/lavalink.ts) e,
 * se não encontrar nada, tenta o Tidal (prefixo "tdsearch:", plugin LavaSrc) como fallback —
 * útil pra faixas que o SoundCloud não tem, comum em lançamentos recentes de gravadoras grandes.
 * O Tidal não toca áudio diretamente (sem fonte própria de streaming no Lavalink/Lavaplayer); o
 * LavaSrc espelha ("mirroring") a faixa resolvida pro Deezer via `plugins.lavasrc.providers` em
 * lavalink/application.yml — ver o comentário lá pros detalhes e credenciais necessárias.
 *
 * `plugins.lavasrc.sources.tidal` começa desativado em lavalink/application.yml até as
 * credenciais serem cadastradas — nesse caso (e também se o token/ARL expirar depois), a busca
 * com "tdsearch:" lança uma exceção síncrona antes mesmo de resolver (mesmo comportamento do
 * "Lavalink Node has not 'X' enabled" que já vimos com o YouTube desativado), então o try/catch
 * aqui é necessário: sem ele, qualquer busca sem resultado no SoundCloud viraria um erro genérico
 * em vez do "❌ Nenhum resultado encontrado." esperado.
 */
export async function searchWithFallback(
  player: Player,
  query: string,
  requester: GuildMember | undefined,
): Promise<SearchResult> {
  const primary = (await player.search({ query }, requester)) as SearchResult;
  if (!isEmptyOrError(primary) || EXPLICIT_SOURCE_PATTERN.test(query)) return primary;

  try {
    const fallback = (await player.search({ query: `tdsearch:${query}` }, requester)) as SearchResult;
    return isEmptyOrError(fallback) ? primary : fallback;
  } catch {
    return primary;
  }
}
