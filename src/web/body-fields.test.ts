import { describe, expect, it } from 'vitest';
import { booleanField, numberField, stringField } from './body-fields.js';

describe('stringField', () => {
  it('retorna o valor quando é uma string', () => {
    expect(stringField({ query: 'lofi' }, 'query')).toBe('lofi');
  });

  it('retorna undefined quando o campo não é string', () => {
    expect(stringField({ query: 42 }, 'query')).toBeUndefined();
  });

  it('retorna undefined quando o campo não existe', () => {
    expect(stringField({}, 'query')).toBeUndefined();
  });

  it('retorna undefined quando o body não é um objeto', () => {
    expect(stringField(null, 'query')).toBeUndefined();
    expect(stringField('lofi', 'query')).toBeUndefined();
    expect(stringField(undefined, 'query')).toBeUndefined();
  });
});

describe('numberField', () => {
  it('retorna o valor quando é um número', () => {
    expect(numberField({ index: 3 }, 'index')).toBe(3);
  });

  it('retorna undefined quando o campo é uma string numérica', () => {
    expect(numberField({ index: '3' }, 'index')).toBeUndefined();
  });

  it('retorna undefined quando o body não é um objeto', () => {
    expect(numberField(null, 'index')).toBeUndefined();
  });
});

describe('booleanField', () => {
  it('retorna true só quando o campo é estritamente true', () => {
    expect(booleanField({ playNext: true }, 'playNext')).toBe(true);
  });

  it('retorna false para valores truthy que não são o booleano true', () => {
    expect(booleanField({ playNext: 'true' }, 'playNext')).toBe(false);
    expect(booleanField({ playNext: 1 }, 'playNext')).toBe(false);
  });

  it('retorna false quando o body não é um objeto', () => {
    expect(booleanField(null, 'playNext')).toBe(false);
  });
});
