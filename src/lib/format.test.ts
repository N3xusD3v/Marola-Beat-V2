import { describe, expect, it } from 'vitest';
import { formatDuration, parseTimeToMs } from './format.js';

describe('formatDuration', () => {
  it('formata segundos abaixo de um minuto como m:ss', () => {
    expect(formatDuration(5000)).toBe('0:05');
  });

  it('formata minutos e segundos', () => {
    expect(formatDuration(65_000)).toBe('1:05');
  });

  it('formata horas como h:mm:ss quando passa de uma hora', () => {
    expect(formatDuration(3_600_000)).toBe('1:00:00');
    expect(formatDuration(3_661_000)).toBe('1:01:01');
  });

  it('trunca milissegundos parciais', () => {
    expect(formatDuration(1_999)).toBe('0:01');
  });

  it('formata zero', () => {
    expect(formatDuration(0)).toBe('0:00');
  });
});

describe('parseTimeToMs', () => {
  it('interpreta segundos crus', () => {
    expect(parseTimeToMs('90')).toBe(90_000);
  });

  it('interpreta mm:ss', () => {
    expect(parseTimeToMs('1:30')).toBe(90_000);
  });

  it('interpreta hh:mm:ss', () => {
    expect(parseTimeToMs('1:02:03')).toBe(3_723_000);
  });

  it('ignora espaços nas pontas', () => {
    expect(parseTimeToMs('  90  ')).toBe(90_000);
  });

  it('retorna null para texto não numérico', () => {
    expect(parseTimeToMs('abc')).toBeNull();
  });

  it('retorna null com mais de três segmentos', () => {
    expect(parseTimeToMs('1:02:03:04')).toBeNull();
  });

  it('retorna null com um segmento inválido misturado a dígitos', () => {
    expect(parseTimeToMs('1:aa')).toBeNull();
  });

  it('retorna null para string vazia', () => {
    expect(parseTimeToMs('')).toBeNull();
  });
});
