import { beforeEach, describe, expect, test, vi } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

describe('RateLimiter', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  test('permite requisições dentro do limite', () => {
    const limiter = new RateLimiter(3, 60);
    const userId = 'user123';

    expect(limiter.check(userId)).toBe(true);
    expect(limiter.check(userId)).toBe(true);
    expect(limiter.check(userId)).toBe(true);
  });

  test('bloqueia requisições acima do limite', () => {
    const limiter = new RateLimiter(2, 60);
    const userId = 'user123';

    expect(limiter.check(userId)).toBe(true);
    expect(limiter.check(userId)).toBe(true);
    expect(limiter.check(userId)).toBe(false);
  });

  test('reseta limite após janela de tempo passar', () => {
    const limiter = new RateLimiter(2, 60);
    const userId = 'user123';

    expect(limiter.check(userId)).toBe(true);
    expect(limiter.check(userId)).toBe(true);
    expect(limiter.check(userId)).toBe(false);

    vi.advanceTimersByTime(61_000);

    expect(limiter.check(userId)).toBe(true);
  });

  test('retorna tempo de espera correto', () => {
    const limiter = new RateLimiter(2, 60);
    const userId = 'user123';

    limiter.check(userId);
    limiter.check(userId);

    const waitTime = limiter.getWaitTime(userId);
    expect(waitTime).toBeGreaterThan(0);
    expect(waitTime).toBeLessThanOrEqual(60);
  });

  test('retorna 0 de espera quando pode fazer requisição', () => {
    const limiter = new RateLimiter(3, 60);
    const userId = 'user123';

    limiter.check(userId);
    expect(limiter.getWaitTime(userId)).toBe(0);
  });

  test('usa janela deslizante corretamente', () => {
    const limiter = new RateLimiter(2, 60);
    const userId = 'user123';

    limiter.check(userId);
    vi.advanceTimersByTime(30_000);
    limiter.check(userId);

    expect(limiter.check(userId)).toBe(false);

    vi.advanceTimersByTime(31_000);

    expect(limiter.check(userId)).toBe(true);
  });

  test('cleanup remove entradas antigas', () => {
    const limiter = new RateLimiter(2, 60);

    limiter.check('user1');
    limiter.check('user2');

    vi.advanceTimersByTime(61_000);
    limiter.cleanup();

    expect(limiter.check('user1')).toBe(true);
    expect(limiter.check('user2')).toBe(true);
  });

  test('mantém limites separados por usuário', () => {
    const limiter = new RateLimiter(2, 60);

    expect(limiter.check('user1')).toBe(true);
    expect(limiter.check('user1')).toBe(true);
    expect(limiter.check('user1')).toBe(false);

    expect(limiter.check('user2')).toBe(true);
    expect(limiter.check('user2')).toBe(true);
    expect(limiter.check('user2')).toBe(false);
  });
});
