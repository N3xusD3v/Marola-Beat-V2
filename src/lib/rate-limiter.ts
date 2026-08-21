/**
 * Rate limiter simples baseado em Map para prevenir abuso de comandos, especialmente
 * buscas do YouTube. Usa uma janela deslizante (sliding window) por usuário.
 */

interface RateLimitEntry {
  timestamps: number[];
}

export class RateLimiter {
  private limits = new Map<string, RateLimitEntry>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 5, windowSeconds = 60) {
    this.maxRequests = maxRequests;
    this.windowMs = windowSeconds * 1000;
  }

  /**
   * Verifica se o usuário pode fazer uma requisição. Retorna true se permitido,
   * false se excedeu o limite.
   */
  check(userId: string): boolean {
    const now = Date.now();
    const entry = this.limits.get(userId);

    if (!entry) {
      this.limits.set(userId, { timestamps: [now] });
      return true;
    }

    const recentTimestamps = entry.timestamps.filter((t) => now - t < this.windowMs);

    if (recentTimestamps.length >= this.maxRequests) {
      return false;
    }

    recentTimestamps.push(now);
    entry.timestamps = recentTimestamps;
    return true;
  }

  /**
   * Retorna quanto tempo (em segundos) o usuário precisa esperar antes de poder
   * fazer outra requisição. Retorna 0 se pode fazer agora.
   */
  getWaitTime(userId: string): number {
    const entry = this.limits.get(userId);
    if (!entry || entry.timestamps.length < this.maxRequests) return 0;

    const now = Date.now();
    const oldestRelevant = entry.timestamps[0];
    if (!oldestRelevant) return 0;

    const elapsed = now - oldestRelevant;
    if (elapsed >= this.windowMs) return 0;

    return Math.ceil((this.windowMs - elapsed) / 1000);
  }

  /**
   * Limpa entradas antigas para evitar vazamento de memória (chamado periodicamente).
   */
  cleanup(): void {
    const now = Date.now();
    for (const [userId, entry] of this.limits.entries()) {
      const recentTimestamps = entry.timestamps.filter((t) => now - t < this.windowMs);
      if (recentTimestamps.length === 0) {
        this.limits.delete(userId);
      } else {
        entry.timestamps = recentTimestamps;
      }
    }
  }
}
