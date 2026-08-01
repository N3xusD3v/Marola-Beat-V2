/** Formata uma duração em milissegundos como `M:SS` (ou `H:MM:SS` se passar de uma hora). */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const paddedSeconds = seconds.toString().padStart(2, '0');
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${paddedSeconds}`;
  }
  return `${minutes}:${paddedSeconds}`;
}

/**
 * Interpreta `"90"` (segundos), `"1:30"` (mm:ss) ou `"1:02:03"` (h:mm:ss) como milissegundos.
 * Retorna `null` se o formato não for reconhecido.
 */
export function parseTimeToMs(input: string): number | null {
  const trimmed = input.trim();
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 1000;

  const parts = trimmed.split(':');
  if (parts.length < 2 || parts.length > 3 || parts.some((part) => !/^\d+$/.test(part))) return null;

  const numbers = parts.map(Number);
  let seconds = 0;
  for (const part of numbers) {
    seconds = seconds * 60 + part;
  }
  return seconds * 1000;
}
