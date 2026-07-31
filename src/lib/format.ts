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
